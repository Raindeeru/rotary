from pydantic import BaseModel, computed_field
from datetime import datetime
from typing import List, Optional

class ExpenseBase(BaseModel):
    date_purchased: datetime
    location: str          # Purchased Where
    description: str       # Item/Materials
    category: str          # Optional, but good for filtering
    quantity: int
    price: float

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    date_purchased: Optional[datetime] = None
    location: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    price: Optional[float] = None

class ExpenseItemResponse(ExpenseBase):
    id: int
    project_id: int

    @computed_field
    def total(self) -> float:
        return self.quantity * self.price

class FinancialBreakdownResponse(BaseModel):
    project_id: int
    project_budget: float
    total_spent: float
    remaining_balance: float
    expenses: List[ExpenseItemResponse]
