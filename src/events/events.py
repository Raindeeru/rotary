# routers/events.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

# Import your database, models, and dependencies
from database.database import get_db
from database.models import Event
from auth.login import require_admin, require_member_or_admin
from auth.login import get_current_user
from auth.public_user import PublicUser
from .schemas import EventCreate, EventUpdate, EventResponse

router = APIRouter(prefix="/events", tags=["Events"])

# --- MEMBER / READ-ONLY ROUTES (FR-28, FR-29) ---


@router.get("/", response_model=List[EventResponse], dependencies=[require_member_or_admin])
async def list_events(db: AsyncSession = Depends(get_db)):
    """
    FR-28: Events visible only to members and administrators.
    FR-29: Read-only access for members.
    """
    result = await db.execute(select(Event))
    return result.scalars().all()


@router.get("/{event_id}", response_model=EventResponse, dependencies=[require_member_or_admin])
async def get_event(event_id: int, db: AsyncSession = Depends(get_db)):
    """FR-28 & FR-29: View a single event."""
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

# --- ADMINISTRATOR ROUTES (FR-26, FR-30) ---


@router.post("/", response_model=EventResponse)
async def create_event(
    event_in: EventCreate,
    current_admin: PublicUser = require_admin,
    db: AsyncSession = Depends(get_db)
):
    """FR-26 & FR-27: Administrators can create categorized events."""
    new_event = Event(
        **event_in.model_dump(),
        admin_id=current_admin.id  # Automatically track which admin created it
    )
    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)
    return new_event


@router.put("/{event_id}", response_model=EventResponse, dependencies=[require_admin])
async def update_event(
    event_id: int,
    event_in: EventUpdate,
    db: AsyncSession = Depends(get_db)
):
    """FR-30: Administrators shall be able to update events."""
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = event_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event, key, value)

    await db.commit()
    await db.refresh(event)
    return event


@router.delete("/{event_id}", dependencies=[require_admin])
async def delete_event(event_id: int, db: AsyncSession = Depends(get_db)):
    """FR-30: Administrators shall be able to delete events."""
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    await db.delete(event)
    await db.commit()
    return {"message": "Event successfully deleted."}
