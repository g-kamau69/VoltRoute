from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.swap_provider import SwapProvider

router = APIRouter(
    prefix="/swap-providers",
    tags=["Swap Providers"]
)

@router.get("/")
def list_swap_providers(
    db: Session = Depends(get_db),
):
    statement = (
        select(SwapProvider)
        .order_by(SwapProvider.name)
    )

    providers = db.scalars(statement).all()

    return [
        {
            "id": provider.id,
            "name": provider.name,
            "website": provider.website,
            "is_active": provider.is_active,
        }
        for provider in providers
    ]