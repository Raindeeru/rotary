# routers/projects.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

# Import your database and dependencies
from database.database import get_db
from database.models import Project, ProjectExpense
from auth.login import require_admin
from auth.login import get_current_user
from auth.public_user import PublicUser
from fastapi.security import OAuth2PasswordBearer
from .schemas import (ProjectBase,
                      ProjectCreate,
                      ProjectMemberResponse,
                      ProjectUpdate,
                      ProjectPublicResponse,
                      ExpenseItem)

router = APIRouter(prefix="/projects", tags=["Projects"])

# Special dependency that doesn't block public users, just identifies them
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)

async def get_optional_user(token: str = Depends(oauth2_scheme_optional)):
    if token:
        # Re-use your token verifier here
        from auth.login import verify_token_and_get_user
        return await verify_token_and_get_user(token)
    return None

# --- PUBLIC / MEMBER READ ROUTES (FR-7, FR-10, FR-11, FR-12) ---
@router.get("/", response_model=List[ProjectPublicResponse])
async def list_projects(db: AsyncSession = Depends(get_db)):
    """FR-7: Public users can view a list of projects with financial summaries."""
    # 1. Fetch all projects
    result = await db.execute(select(Project))
    projects = result.scalars().all()
    response_list = []
    # 2. Calculate the math for each project
    for project in projects:
        # Fetch expenses just for this project
        exp_result = await db.execute(
            select(ProjectExpense).where(ProjectExpense.project_id == project.id)
        )
        expenses = exp_result.scalars().all()
        # Calculate summary values
        total_spent = sum([exp.price * exp.quantity for exp in expenses])
        remaining = project.budget - total_spent
        # 3. Assemble the data perfectly matching the Pydantic schema
        project_data = {
            "id": project.id,
            "title": project.title,
            "description": project.description,
            "location": project.location,
            "start_date": project.start_date,
            "end_date": project.end_date,
            "status": project.status,
            "total_expenses": total_spent,
            "remaining_balance": remaining
        }
        response_list.append(project_data)
    return response_list

@router.get("/{project_id}")
async def get_project_details(
    project_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: PublicUser = Depends(get_optional_user)
):
    """
    FR-10 & FR-11: Returns summary for public, full breakdown for members.
    """
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch expenses (you could also do this with a joinedload in SQLAlchemy)
    expenses_result = await db.execute(
        select(ProjectExpense).where(ProjectExpense.project_id == project_id)
    )
    expenses = expenses_result.scalars().all()
    
    # Calculate summary values
    total_spent = sum([exp.price * exp.quantity for exp in expenses])
    # Assuming you add a 'budget' to your model later, we'll mock it for now
    budget = 10000.0
    remaining = budget - total_spent

    base_data = {
        "id": project.id,
        "title": project.title,
        "description": project.description,
        "location": project.location,
        "start_date": project.start_date,
        "end_date": project.end_date,
        "status": project.status,
        "total_expenses": total_spent,
        "remaining_balance": remaining
    }

    # FR-11: If user is logged in (Member or Admin), give them everything
    if current_user and current_user.role in ["Member", "Admin"]:
        base_data["expenses"] = expenses
        return ProjectMemberResponse(**base_data)
    
    # FR-10: Otherwise, just give the summary
    return ProjectPublicResponse(**base_data)

# --- ADMINISTRATOR ROUTES (FR-13, FR-14) ---

@router.post("/", dependencies=[require_admin])
async def create_project(project_in: ProjectCreate, db: AsyncSession = Depends(get_db)):
    """FR-13: Administrators can create project records."""
    # Ensure status is valid (FR-9)
    if project_in.status not in ["Planned", "Ongoing", "Completed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    new_project = Project(**project_in.model_dump())
    db.add(new_project)
    await db.commit()
    return {"message": "Project created successfully"}

@router.put("/{project_id}", dependencies=[require_admin])
async def update_project(
    project_id: int, 
    project_in: ProjectUpdate, 
    db: AsyncSession = Depends(get_db)
):
    """FR-13 & FR-14: Administrators can update project records and status."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project_in.status and project_in.status not in ["Planned", "Ongoing", "Completed"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    # Update only the fields provided
    update_data = project_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)

    await db.commit()
    return {"message": "Project updated successfully"}

@router.delete("/{project_id}", dependencies=[require_admin])
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    """FR-13: Administrators can delete project records."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    await db.delete(project)
    await db.commit()
    return {"message": "Project deleted successfully"}
