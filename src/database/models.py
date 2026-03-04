from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
import datetime
from typing import List, Optional
from sqlalchemy import ForeignKey, DateTime, String, Numeric
from sqlalchemy.ext.asyncio import AsyncAttrs

class Base(AsyncAttrs, DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    vocation: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(100), unique=True)
    role: Mapped[str]
    hash: Mapped[str]
    status: Mapped[str]

class Project(Base):
    __tablename__ = "projects"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    description: Mapped[str]
    location: Mapped[str]
    start_date: Mapped[datetime.datetime]
    end_date: Mapped[datetime.datetime]
    status: Mapped[str] = mapped_column(default="Planned")
    budget: Mapped[float] = mapped_column(default=0.0)

    admin_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

class ProjectExpense(Base):
    __tablename__ = "project_expenses"
    id: Mapped[int] = mapped_column(primary_key=True)

    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))

    price: Mapped[float] 
    description: Mapped[str]
    category: Mapped[str]
    quantity: Mapped[int]
    location: Mapped[str]
    date_purchased: Mapped[datetime.datetime]

class Event(Base):
    __tablename__ = "events"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    description: Mapped[str]
    date: Mapped[datetime.datetime]
    event_type: Mapped[str] = mapped_column(String(50))

    admin_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

class EventExpense(Base):
    __tablename__ = "event_expenses"
    id: Mapped[int] = mapped_column(primary_key=True)

    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"))

    price: Mapped[float]
    description: Mapped[str]
    category: Mapped[str]
    quantity: Mapped[int]
    location: Mapped[str]
    date_purchased: Mapped[datetime.datetime]
