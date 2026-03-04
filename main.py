import uvicorn
from api.api import get_app
from database.database import create_tables
import asyncio

app = get_app()


def main():
    asyncio.run(create_tables())
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
