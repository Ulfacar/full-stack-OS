from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...core.security import verify_password, get_password_hash, create_access_token
from ...db.database import get_db
from ...db.models import User
from ..schemas import UserCreate, UserLogin, Token, User as UserSchema

router = APIRouter(prefix="/auth", tags=["auth"])


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
    # Find user
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

    # Create token
    access_token = create_access_token(data={"sub": str(user.id)})

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/dev/create-demo-user", response_model=UserSchema)
async def create_demo_user(
    db: AsyncSession = Depends(get_db)
):
    """
    DEV ENDPOINT: Create demo user if it doesn't exist
    Email: demo@asystem.com
    Password: demo123
    """
    # Check if demo user already exists
    result = await db.execute(select(User).where(User.email == "demo@asystem.com"))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        return existing_user

    # Create demo user
    hashed_password = get_password_hash("demo123")
    demo_user = User(
        name="Demo User",
        email="demo@asystem.com",
        hashed_password=hashed_password,
        is_active=True
    )

    db.add(demo_user)
    await db.commit()
    await db.refresh(demo_user)

    return demo_user
