"""Busca de cidades para a posição das paradas no mapa."""

from fastapi import APIRouter, Depends, Query
from starlette.concurrency import run_in_threadpool

from .. import geo
from ..deps import fail, user_session
from ..security import ActiveSession

router = APIRouter(prefix='/api/geo', tags=['geo'])


@router.get('/search')
async def search(q: str = Query(min_length=2, max_length=120), _: ActiveSession = Depends(user_session)):
    try:
        return await run_in_threadpool(geo.search, q)
    except geo.GeoError as err:
        fail(502, 'geo_unavailable', str(err))
