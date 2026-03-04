# schemas.py (or inside your projects router)
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# FR-8 & FR-9: Project details and allowed statuses
class ProjectBase(BaseModel):
    title: str
    description: str
    location: str
    start_date: datetime
    end_date: datetime
    status: str

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None # FR-14: Admin can update status

class ExpenseItem(BaseModel):
    id: int
    description: str
    category: str
    quantity: int
    price: float
    location: str
    date_purchased: datetime

class ProjectPublicResponse(ProjectBase):
    id: int
    total_expenses: float 
    remaining_balance: float

class ProjectMemberResponse(ProjectPublicResponse):
    expenses: List[ExpenseItem] = []
