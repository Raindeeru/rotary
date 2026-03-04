from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from sqlalchemy import select

# Import your actual database session and models
from database.database import AsyncSessionLocal
from database.models import User
from .public_user import PublicUser
from typing import List

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password):
    return password_hash.hash(password)


async def get_user_by_username(username: str, public_only: bool = True):
    """Fetches user and optionally converts to PublicUser Pydantic model."""
    async with AsyncSessionLocal() as db:
        stmt = select(User).where(User.username == username)
        result = await db.execute(stmt)
        user_obj = result.scalar_one_or_none()

        if not user_obj:
            return None
        if public_only:
            return PublicUser.model_validate(user_obj)
        return user_obj


async def authenticate_user(username: str, password: str):
    user = await get_user_by_username(username, public_only=False)
    if not user:
        return False
    if not verify_password(password, user.hash):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception

    user = await get_user_by_username(username=username)
    if user is None:
        raise credentials_exception
    return user


def RoleChecker(allowed_roles: List[str]):
    def check_role(user: PublicUser = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )
        return user
    return check_role


require_admin = Depends(RoleChecker(["Admin"]))
require_member_or_admin = Depends(RoleChecker(["Member", "Admin"]))
