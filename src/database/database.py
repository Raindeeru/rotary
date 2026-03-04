from dotenv import load_dotenv
import os

from sqlalchemy.ext.asyncio import (
        async_sessionmaker, 
        AsyncSession, 
        create_async_engine)

from sqlalchemy.pool import StaticPool

from .models import Base


load_dotenv()

db_name = os.getenv('DB_NAME')
db_user = os.getenv('DB_USER')
db_password = os.getenv('DB_PASSWORD')
db_host = os.getenv('DB_HOST')
db_port = os.getenv('DB_PORT')

# engine = create_async_engine(f"postgresql+asyncpg://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}")


engine = create_async_engine(
    "sqlite+aiosqlite:///./test.db",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool, 
)


async def create_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await engine.dispose()

AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False
        )


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
