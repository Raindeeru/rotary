from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database.database import get_db
from database.models import Project, ProjectExpense
from auth.login import require_admin

from .schemas import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseItemResponse,
    FinancialBreakdownResponse
)

router = APIRouter(prefix="/projects/{project_id}/financials", tags=["Financial Breakdown"])


@router.get("/", response_model=FinancialBreakdownResponse)
async def get_financial_breakdown(project_id: int, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(
        select(ProjectExpense).where(ProjectExpense.project_id == project_id)
    )
    expenses = result.scalars().all()

    total_spent = sum([exp.price * exp.quantity for exp in expenses])
    remaining_balance = project.budget - total_spent

    return {
        "project_id": project.id,
        "project_budget": project.budget,
        "total_spent": total_spent,
        "remaining_balance": remaining_balance,
        "expenses": expenses
    }

@router.post("/", response_model=ExpenseItemResponse, dependencies=[require_admin])
async def add_financial_record(
    project_id: int, 
    expense_in: ExpenseCreate, 
    db: AsyncSession = Depends(get_db)
):
    """FR-19: Administrators shall be able to add financial records."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    new_expense = ProjectExpense(**expense_in.model_dump(), project_id=project_id)
    db.add(new_expense)
    await db.commit()
    await db.refresh(new_expense)

    return new_expense

@router.put("/{expense_id}", response_model=ExpenseItemResponse, dependencies=[require_admin])
async def update_financial_record(
    project_id: int, 
    expense_id: int, 
    expense_in: ExpenseUpdate, 
    db: AsyncSession = Depends(get_db)
):
    """FR-19: Administrators shall be able to update financial records."""
    expense = await db.get(ProjectExpense, expense_id)

    if not expense or expense.project_id != project_id:
        raise HTTPException(status_code=404, detail="Expense record not found for this project")

    update_data = expense_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(expense, key, value)

    await db.commit()
    await db.refresh(expense)

    return expense

@router.delete("/{expense_id}", dependencies=[require_admin])
async def delete_financial_record(
    project_id: int, 
    expense_id: int, 
    db: AsyncSession = Depends(get_db)
):
    """FR-19: Administrators shall be able to delete financial records."""
    expense = await db.get(ProjectExpense, expense_id)
    if not expense or expense.project_id != project_id:
        raise HTTPException(status_code=404, detail="Expense record not found for this project")

    await db.delete(expense)
    await db.commit()
    return {"message": "Financial record successfully deleted."}
