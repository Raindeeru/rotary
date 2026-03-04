from pydantic import BaseModel, ConfigDict


class PublicUser(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    role: str
    status: str
