"""Aplicação FastAPI: rotas, cabeçalhos de segurança, checagem de origem e o painel (React) compilado."""

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse, Response
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import Settings, load_settings
from .db import make_engine, make_sessionmaker
from .routes import activity, auth, users

SAFE_METHODS = {'GET', 'HEAD', 'OPTIONS'}

# Só roda código do próprio painel. Estilos inline são necessários pelo Emotion (CSS-in-JS do site).
CSP = '; '.join(
    [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https://i.ytimg.com",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'none'",
        "form-action 'self'",
        "object-src 'none'",
    ]
)


def _error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse({'detail': {'code': code, 'message': message}}, status_code=status)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or load_settings()
    app = FastAPI(
        title='Turista-Life Administração',
        docs_url='/api/docs' if settings.debug else None,
        redoc_url=None,
        openapi_url='/api/openapi.json' if settings.debug else None,
    )
    engine = make_engine(settings.database_url)
    app.state.settings = settings
    app.state.engine = engine
    app.state.sessionmaker = make_sessionmaker(engine)

    @app.middleware('http')
    async def guard(request: Request, call_next):
        # Pedidos que alteram dados só valem se vierem do próprio painel (contra CSRF e sites falsos).
        if request.url.path.startswith('/api/') and request.method not in SAFE_METHODS:
            origin = request.headers.get('origin')
            same_site = request.headers.get('sec-fetch-site') == 'same-origin'
            if origin is not None:
                if origin.rstrip('/') not in settings.allowed_origins:
                    return _error(403, 'origin', 'Pedido recusado.')
            elif not same_site:
                return _error(403, 'origin', 'Pedido recusado.')
            has_body = int(request.headers.get('content-length') or 0) > 0 or 'transfer-encoding' in request.headers
            if has_body and 'application/json' not in request.headers.get('content-type', ''):
                return _error(415, 'content_type', 'Formato de pedido não aceito.')

        response: Response = await call_next(request)
        h = response.headers
        h['Content-Security-Policy'] = CSP
        h['X-Content-Type-Options'] = 'nosniff'
        h['X-Frame-Options'] = 'DENY'
        h['Referrer-Policy'] = 'no-referrer'
        h['Cross-Origin-Opener-Policy'] = 'same-origin'
        h['Cross-Origin-Resource-Policy'] = 'same-origin'
        h['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
        h['X-Robots-Tag'] = 'noindex, nofollow'
        if settings.cookie_secure:
            h['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        if request.url.path.startswith('/api/'):
            h['Cache-Control'] = 'no-store'
        return response

    @app.exception_handler(StarletteHTTPException)
    async def http_error(_request: Request, exc: StarletteHTTPException):
        if isinstance(exc.detail, dict):
            return JSONResponse({'detail': exc.detail}, status_code=exc.status_code, headers=getattr(exc, 'headers', None))
        messages = {404: 'Não encontrado.', 405: 'Ação não permitida.'}
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

    if settings.admin_dist and settings.admin_dist.is_dir():
        _mount_admin(app, settings.admin_dist.resolve())

    return app


def _mount_admin(app: FastAPI, dist: Path) -> None:
    """Serve o painel compilado. Qualquer endereço que não seja arquivo cai no index.html (rotas do React)."""
    index = dist / 'index.html'

    @app.api_route('/{path:path}', methods=['GET', 'HEAD'], include_in_schema=False)
    def spa(path: str):
        if path.startswith('api/'):
            return _error(404, 'http', 'Não encontrado.')
        candidate = (dist / path).resolve()
        if path and candidate.is_file() and candidate.is_relative_to(dist):
            headers = {'Cache-Control': 'public, max-age=31536000, immutable'} if path.startswith('assets/') else {'Cache-Control': 'no-cache'}
            return FileResponse(candidate, headers=headers)
        return FileResponse(index, headers={'Cache-Control': 'no-cache'})
