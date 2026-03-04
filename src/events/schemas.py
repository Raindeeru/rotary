# schemas/events.py
from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional

# FR-27: Allowed event categories
ALLOWED_EVENT_TYPES = [
    "Meeting",
    "Project Schedule",
    "Induction Ceremony",
    "Rescheduling Notice"
]

class EventBase(BaseModel):
    title: str
    description: str
    date: datetime
    event_type: str 

    @field_validator('event_type')
    def validate_event_type(cls, v):
        if v not in ALLOWED_EVENT_TYPES:
            raise ValueError(f"event_type must be one of {ALLOWED_EVENT_TYPES}")
        return v

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    event_type: Optional[str] = None

    @field_validator('event_type')
    def validate_event_type(cls, v):
        if v is not None and v not in ALLOWED_EVENT_TYPES:
            raise ValueError(f"event_type must be one of {ALLOWED_EVENT_TYPES}")
        return v

class EventResponse(EventBase):
    id: int
    admin_id: Optional[int]
