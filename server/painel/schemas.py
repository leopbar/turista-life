"""Formato dos dados que entram e saem da API (em camelCase, como o painel em TypeScript usa)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from pydantic.alias_generators import to_camel

from .models import User


class Api(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra='forbid')


class UserOut(Api):
    id: int
    email: str
    name: str
    role: Literal['admin', 'editor']
    is_active: bool
    must_change_password: bool
    temp_password_expires_at: datetime | None
    created_at: datetime
    last_login_at: datetime | None

    @classmethod
    def of(cls, u: User) -> 'UserOut':
        return cls(
            id=u.id,
            email=u.email,
            name=u.name,
            role=u.role,
            is_active=u.is_active,
            must_change_password=u.must_change_password,
            temp_password_expires_at=u.temp_password_expires_at,
            created_at=u.created_at,
            last_login_at=u.last_login_at,
        )


class Me(Api):
    user: UserOut
    csrf: str


class LoginIn(Api):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=256)


class ChangePasswordIn(Api):
    current_password: str = Field(min_length=1, max_length=256)
    new_password: str = Field(min_length=1, max_length=256)


class CheckPasswordIn(Api):
    password: str = Field(max_length=256)


def _clean_name(v: str) -> str:
    v = ' '.join(v.split())
    if not v:
        raise ValueError('Escreva o nome.')
    return v


class UserCreate(Api):
    email: EmailStr = Field(max_length=254)
    name: str = Field(min_length=1, max_length=80)
    role: Literal['admin', 'editor']

    _name = field_validator('name')(_clean_name)


class UserUpdate(Api):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    role: Literal['admin', 'editor'] | None = None

    @field_validator('name')
    @classmethod
    def _name(cls, v: str | None) -> str | None:
        return None if v is None else _clean_name(v)


class TempPasswordOut(Api):
    user: UserOut
    # Aparece só nesta resposta. O banco guarda apenas o hash.
    temp_password: str
    expires_at: datetime


class AuditOut(Api):
    id: int
    created_at: datetime
    actor_email: str | None
    action: str
    target: str | None
    ip: str | None
    details: dict


class AuditPage(Api):
    items: list[AuditOut]
    next_before: int | None


class ChainStatus(Api):
    ok: bool
    broken_at: int | None
