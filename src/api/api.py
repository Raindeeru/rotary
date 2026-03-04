from .auth import router as auth_router
from .members import router as members_router
from management.management import router as management_router
from financial.financial import router as financial_router
from events.events import router as events_router

from fastapi import FastAPI
from database.database import create_tables
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

origins = [
        '*'
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run startup logic
    await create_tables()
    yield
    # Run shutdown logic (if any) here


def get_app() -> FastAPI:
    app = FastAPI(title="Rotary Management", lifespan=lifespan)

    app.include_router(auth_router)
    app.include_router(members_router)
    app.include_router(management_router)
    app.include_router(financial_router)
    app.include_router(events_router)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,            # Allows specific origins
        allow_credentials=True,           # Allows cookies/auth headers
        allow_methods=["*"],              # Allows all methods (GET, POST, etc.)
        allow_headers=["*"],              # Allows all headers
    )

    @app.get("/")
    async def root():
        return {"Connection Status": "Success"}

    return app

