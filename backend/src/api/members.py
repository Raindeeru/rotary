from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from sqlalchemy import select
from typing import List, Optional

from database.database import get_db
from database.models import User
from auth.login import require_admin, require_member_or_admin
from auth.login import get_current_user
from auth.public_user import PublicUser

# Import your dependencies and helpers
from auth.login import (get_current_user,
                        authenticate_user,
                        get_password_hash,
                        require_admin,
                        require_member_or_admin)


from pydantic import BaseModel, Field

# schemas/members.py (or inside your router file)


# FR-22: Public view (Name and Vocation ONLY)
class MemberPublicResponse(BaseModel):
    name: str
    vocation: str


# FR-23: Full view for logged-in Members
class MemberFullResponse(MemberPublicResponse):
    id: int
    username: str
    email: str
    role: str
    status: str


# FR-24: What a member is allowed to update on their own profile
class MemberProfileUpdate(BaseModel):
    name: Optional[str] = None
    vocation: Optional[str] = None
    email: Optional[str] = None


# FR-25: What an admin is allowed to update on someone else
class AdminMemberUpdate(MemberProfileUpdate):
    role: Optional[str] = None
    status: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


router = APIRouter(prefix="/members", tags=["Members Directory"])


@router.post("/invite", dependencies=[require_admin])
async def invite_member(
    username: str,
    email: str,
    role: str = "Member",
    db: AsyncSession = Depends(get_db)
):
    """
    FR-3: Only Admins can hit this route to add new members to the system.
    """

    temp_password = "password"
    hashed_pwd = get_password_hash(temp_password)

    new_user = User(
        username=username,
        email=email,
        role=role,
        hash=hashed_pwd,
        status="Active"
    )

    try:
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with that email or username might already exist."
        )

    return {
        "message": f"Successfully invited {username}.",
        "temporary_password": temp_password,
        "instructions": "Please provide this temporary password to the user."
    }


@router.put("/change-password")
async def change_password(
    request: PasswordChangeRequest,
    current_user: PublicUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Allows an authenticated user to change their own password.
    Perfect for users logging in with their temporary 'changeme123' password.
    """
    is_valid = await authenticate_user(current_user.username, request.current_password)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password."
        )

    new_hashed_password = get_password_hash(request.new_password)

    try:
        stmt = (
            update(User)
            .where(User.id == current_user.id)
            .values(hash=new_hashed_password)
        )
        await db.execute(stmt)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password."
        )

    return {"message": "Password updated successfully."}


@router.get("/public", response_model=List[MemberPublicResponse])
async def get_public_directory(db: AsyncSession = Depends(get_db)):
    """FR-22: Public users view a basic directory (name and vocation only)."""
    # We only want to show Active members in the directory
    result = await db.execute(select(User).where(User.status == "Active"))
    members = result.scalars().all()
    return members


@router.get("/", response_model=List[MemberFullResponse], dependencies=[require_member_or_admin])
async def get_full_directory(
    vocation: Optional[str] = None, 
    db: AsyncSession = Depends(get_db)
):
    """FR-23: Members view the full directory and can search by vocation."""
    query = select(User)
    
    # If a vocation search term is provided, filter the query
    if vocation:
        query = query.where(User.vocation.ilike(f"%{vocation}%"))
        
    result = await db.execute(query)
    return result.scalars().all()

@router.put("/me", response_model=MemberFullResponse)
async def update_own_profile(
    profile_data: MemberProfileUpdate,
    current_user: PublicUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """FR-24: Members shall be able to update their own profile information."""
    # Fetch the actual database record for the logged-in user
    user = await db.get(User, current_user.id)
    
    update_data = profile_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)

    await db.commit()
    await db.refresh(user)
    return user

# --- ADMINISTRATOR ROUTES (FR-25) ---

# Note: You already built POST /members/invite in an earlier step! 
# That satisfies the "add invited members" part of FR-25.

@router.put("/{user_id}", response_model=MemberFullResponse, dependencies=[require_admin])
async def update_member_record(
    user_id: int,
    update_data: AdminMemberUpdate,
    db: AsyncSession = Depends(get_db)
):
    """FR-25: Administrators shall be able to update member records."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data = update_data.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(user, key, value)

    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/{user_id}", dependencies=[require_admin])
async def remove_member_record(user_id: int, db: AsyncSession = Depends(get_db)):
    """FR-25: Administrators shall be able to remove member records."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user)
    await db.commit()
    return {"message": "Member record successfully removed."}
