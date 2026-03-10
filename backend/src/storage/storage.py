import os
from dotenv import load_dotenv
from abc import ABC, abstractmethod
from fastapi import Depends
from typing import Annotated


class StorageProvider(ABC):
    @abstractmethod
    async def upload(self, file, filename: str) -> str:
        """Returns the public URL of the uploaded file"""
        pass

    @abstractmethod
    def get_url(self, path: str) -> str:
        """Turns the DB string into a full usable URL"""
        pass

    @abstractmethod
    async def delete(self, filename: str):
        """Removes the physical file from storage"""
        pass


class LocalStorage(StorageProvider):
    def __init__(self, upload_dir="uploads"):
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)

    async def upload(self, file, filename: str) -> str:
        path = os.path.join(self.upload_dir, filename)
        with open(path, "wb") as buffer:
            buffer.write(await file.read())
        return f"/static/{filename}"

    def get_url(self, path: str) -> str:
        base = os.getenv("BASE_URL", "http://localhost:8000")
        return f"{base}{path}"

    async def delete(self, filename: str):
        path = os.path.join(self.upload_dir, filename)
        if os.path.exists(path):
            os.remove(path)

# dagdag lang dito ng mga cloud storage shit if kailangan baka supabase for testing

######


load_dotenv()


def get_storage() -> StorageProvider:
    return LocalStorage()


StorageDep = Annotated[StorageProvider, Depends(get_storage)]
