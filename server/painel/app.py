"""Aplicação FastAPI: rotas, cabeçalhos de segurança, checagem de origem, o painel (React) compilado
e a cópia do site usada na pré-visualização."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse, Response
from sqlalchemy import inspect
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import content, worker
from .config import Settings, load_settings
from .db import make_engine, make_sessionmaker, write
from .routes import activity, auth, content as content_routes, geo, media, system, users

SAFE_METHODS = {'GET', 'HEAD', 'OPTIONS'}

_COMMON = [
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "base-uri 'none'",
    "form-action 'self'",
    "object-src 'none'",
]

# Painel: só roda código do próprio painel. Estilos inline são necessários pelo Emotion (CSS-in-JS).
# Pode mostrar o site (pré-visualização) num iframe da mesma origem, nada mais.
CSP_PANEL = '; '.join([
    "default-src 'self'", "script-src 'self'", "img-src 'self' data: blob: https://i.ytimg.com",
    "connect-src 'self'", "frame-src 'self'", "frame-ancestors 'none'", *_COMMON,
])

# Cópia do site na pré-visualização: igual ao site público (vídeos do YouTube, fotos externas),
# e só pode ser aberta dentro do próprio painel.
CSP_SITE = '; '.join([
    "default-src 'self'", "script-src 'self'", "img-src 'self' data: blob: https:",
    "connect-src 'self' https:", "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
    "frame-ancestors 'self'", *_COMMON,
])


def _error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse({'detail': {'code': code, 'message': message}}, status_code=status)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or load_settings()
    engine = make_engine(settings.database_url)
    sessionmaker = make_sessionmaker(engine)

    # Todo documento do mapa existe no banco e o arquivo publicado está em dia.
    if inspect(engine).has_table('documents'):
        db = sessionmaker()
        try:
            with write(db):
                content.seed(db)
                content.write_bundle(db, settings)
        finally:
            db.close()

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        stop = worker.start(sessionmaker, settings)
        yield
        stop.set()

    app = FastAPI(
        title='Turista-Life Administração',
        docs_url='/api/docs' if settings.debug else None,
        redoc_url=None,
        openapi_url='/api/openapi.json' if settings.debug else None,
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.state.engine = engine
    app.state.sessionmaker = sessionmaker

    @app.middleware('http')
    async def guard(request: Request, call_next):
        path = request.url.path
        # Pedidos que alteram dados só valem se vierem do próprio painel (contra CSRF e sites falsos).
        if path.startswith('/api/') and request.method not in SAFE_METHODS:
            origin = request.headers.get('origin')
            same_site = request.headers.get('sec-fetch-site') == 'same-origin'
            if origin is not None:
                if origin.rstrip('/') not in settings.allowed_origins:
                    return _error(403, 'origin', 'Pedido recusado.')
            elif not same_site:
                return _error(403, 'origin', 'Pedido recusado.')
            has_body = int(request.headers.get('content-length') or 0) > 0 or 'transfer-encoding' in request.headers
            ctype = request.headers.get('content-type', '')
            # Envio de fotos chega como multipart; todo o resto, só JSON.
            allowed = 'multipart/form-data' in ctype if path == '/api/media' else 'application/json' in ctype
            if has_body and not allowed:
                return _error(415, 'content_type', 'Formato de pedido não aceito.')

        response: Response = await call_next(request)
        h = response.headers
        site = path.startswith('/site/')
        h['Content-Security-Policy'] = CSP_SITE if site else CSP_PANEL
        h['X-Content-Type-Options'] = 'nosniff'
        h['X-Frame-Options'] = 'SAMEORIGIN' if site else 'DENY'
        h['Referrer-Policy'] = 'no-referrer' if not site else 'strict-origin-when-cross-origin'
        h['Cross-Origin-Opener-Policy'] = 'same-origin'
        h['Cross-Origin-Resource-Policy'] = 'same-origin'
        h['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
        h['X-Robots-Tag'] = 'noindex, nofollow'
        if settings.cookie_secure:
            h['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        if path.startswith('/api/') and 'cache-control' not in h:
            h['Cache-Control'] = 'no-store'
        return response

    @app.exception_handler(StarletteHTTPException)
    async def http_error(_request: Request, exc: StarletteHTTPException):
        if isinstance(exc.detail, dict):
            return JSONResponse({'detail': exc.detail}, status_code=exc.status_code, headers=getattr(exc, 'headers', None))
        messages = {404: 'Não encontrado.', 405: 'Ação não permitida.', 413: 'Arquivo grande demais.'}
        return _error(exc.status_code, 'http', messages.get(exc.status_code, 'Algo deu errado.'))

    @app.exception_handler(RequestValidationError)
    async def validation_error(_request: Request, exc: RequestValidationError):
        fields = {}
        for err in exc.errors():
            loc = [str(p) for p in err.get('loc', []) if p not in ('body', 'query', 'path')]
            fields['.'.join(loc) or 'pedido'] = err.get('msg', 'inválido')
        return JSONResponse(
            {'detail': {'code': 'invalid', 'message': 'Confira os campos e tente de novo.', 'fields': fields}},
            status_code=422,
        )

    @app.get('/api/health')
    def health():
        return {'ok': True}

    app.include_router(auth.router)
    app.include_router(users.router)
    app.include_router(activity.router)
    app.include_router(content_routes.router)
    app.include_router(media.router)
    app.include_router(geo.router)
    app.include_router(system.router)

    _mount_site(app, settings)
    if settings.admin_dist and settings.admin_dist.is_dir():
        _mount_spa(app, '', settings.admin_dist.resolve())

    return app


def _safe_file(base: Path, rel: str) -> Path | None:
    candidate = (base / rel).resolve()
    return candidate if rel and candidate.is_file() and candidate.is_relative_to(base) else None


def _mount_site(app: FastAPI, settings: Settings) -> None:
    """Pré-visualização: /site/ é uma cópia do site e /site/cms/ são as fotos e o conteúdo publicados."""
    public = content.public_dir(settings).resolve()

    @app.api_route('/site/cms/{path:path}', methods=['GET', 'HEAD'], include_in_schema=False)
    def site_cms(path: str):
        f = _safe_file(public, path)
        if f is None:
            return _error(404, 'http', 'Não encontrado.')
        cache = 'no-cache' if f.name == 'site.json' else 'public, max-age=31536000, immutable'
        return FileResponse(f, headers={'Cache-Control': cache})

    if settings.site_dist and settings.site_dist.is_dir():
        _mount_spa(app, 'site', settings.site_dist.resolve())


def _mount_spa(app: FastAPI, prefix: str, dist: Path) -> None:
    """Serve um app React compilado. Endereços que não são arquivo caem no index.html (rotas do React)."""
    index = dist / 'index.html'
    route = f'/{prefix}/{{path:path}}' if prefix else '/{path:path}'

    @app.api_route(route, methods=['GET', 'HEAD'], include_in_schema=False, name=f'spa_{prefix or "root"}')
    def spa(path: str):
        if not prefix and (path.startswith('api/') or path.startswith('site/')):
            return _error(404, 'http', 'Não encontrado.')
        f = _safe_file(dist, path)
        if f is not None:
            headers = {'Cache-Control': 'public, max-age=31536000, immutable'} if path.startswith('assets/') else {'Cache-Control': 'no-cache'}
            return FileResponse(f, headers=headers)
        return FileResponse(index, headers={'Cache-Control': 'no-cache'})
