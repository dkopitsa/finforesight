"""Authentication routes for user registration, login, refresh, and logout."""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    TokenRefreshRequest,
    TokenRefreshResponse,
)
from app.schemas.user import UserResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    """Register a new user.

    Args:
        user_data: User registration data
        db: Database session

    Returns:
        AuthResponse: User data and authentication tokens

    Raises:
        HTTPException: If email is already registered
    """
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        currency=user_data.currency,
        is_active=True,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Generate tokens
    access_token = create_access_token(subject=new_user.id)
    refresh_token_str = create_refresh_token(subject=new_user.id)

    # Store refresh token in database
    refresh_token = RefreshToken(
        token=refresh_token_str,
        user_id=new_user.id,
        expires_at=RefreshToken.create_expiry(),
        is_revoked=False,
    )
    db.add(refresh_token)
    await db.commit()

    logger.info(f"New user registered: {new_user.email} (ID: {new_user.id})")

    return AuthResponse(
        user=UserResponse.model_validate(new_user),
        access_token=access_token,
        refresh_token=refresh_token_str,
        token_type="bearer",
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    """Login with email and password.

    Args:
        login_data: Login credentials
        db: Database session

    Returns:
        AuthResponse: User data and authentication tokens

    Raises:
        HTTPException: If credentials are invalid
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    # Generate tokens
    access_token = create_access_token(subject=user.id)
    refresh_token_str = create_refresh_token(subject=user.id)

    # Store refresh token in database
    refresh_token = RefreshToken(
        token=refresh_token_str,
        user_id=user.id,
        expires_at=RefreshToken.create_expiry(),
        is_revoked=False,
    )
    db.add(refresh_token)
    await db.commit()

    logger.info(f"User logged in: {user.email} (ID: {user.id})")

    return AuthResponse(
        user=UserResponse.model_validate(user),
        access_token=access_token,
        refresh_token=refresh_token_str,
        token_type="bearer",
    )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(
    token_data: TokenRefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenRefreshResponse:
    """Refresh access token using refresh token.

    Args:
        token_data: Refresh token
        db: Database session

    Returns:
        TokenRefreshResponse: New access token

    Raises:
        HTTPException: If refresh token is invalid or expired
    """
    # Decode refresh token
    payload = decode_token(token_data.refresh_token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify token type
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user ID from token
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify refresh token exists in database and is valid
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token == token_data.refresh_token)
    )
    db_token = result.scalar_one_or_none()

    if not db_token or not db_token.is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify user exists and is active
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate new access token
    access_token = create_access_token(subject=user.id)

    logger.info(f"Access token refreshed for user: {user.email} (ID: {user.id})")

    return TokenRefreshResponse(
        access_token=access_token,
        token_type="bearer",
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    token_data: TokenRefreshRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Logout by revoking refresh token.

    Args:
        token_data: Refresh token to revoke
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If refresh token is not found
    """
    # Find and revoke the refresh token
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token == token_data.refresh_token,
            RefreshToken.user_id == current_user.id,
        )
    )
    db_token = result.scalar_one_or_none()

    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Refresh token not found",
        )

    # Revoke the token
    db_token.is_revoked = True
    db_token.updated_at = datetime.utcnow()
    await db.commit()

    logger.info(f"User logged out: {current_user.email} (ID: {current_user.id})")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
) -> UserResponse:
    """Get current user information.

    Args:
        current_user: Current authenticated user

    Returns:
        UserResponse: Current user data
    """
    return UserResponse.model_validate(current_user)
