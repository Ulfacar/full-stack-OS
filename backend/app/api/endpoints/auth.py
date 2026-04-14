from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer()
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ...core.security import verify_password, get_password_hash, create_access_token
from ...db.database import get_db
from ...db.models import User
from ..schemas import UserCreate, UserLogin, Token, User as UserSchema
from ...core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

# Max allowed users — prevents open registration abuse.
# First user becomes admin, subsequent registrations require invite code.
INVITE_CODE = "EXMACHINA2026"


@router.post("/register", response_model=UserSchema)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if this is the first user (auto-approve) or require invite code
    count_result = await db.execute(select(func.count(User.id)))
    user_count = count_result.scalar() or 0

    if user_count > 0:
        # Not the first user — require invite code in the name field
        # Format: "Name|INVITE_CODE"
        if "|" not in user_data.name or user_data.name.split("|")[-1] != INVITE_CODE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Registration is invite-only. Contact admin."
            )
        user_data.name = user_data.name.split("|")[0].strip()

    # Create user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hashed_password
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserSchema)
async def get_me(
    db: AsyncSession = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Получить текущего пользователя по токену."""
    from ...core.security import decode_access_token

    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
