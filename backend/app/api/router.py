from fastapi import APIRouter

api_router = APIRouter()


@api_router.get("/health")
async def api_health_check():
    """API health check endpoint."""
    return {"status": "healthy", "api_version": "v1"}


# Future routers will be included here
# Example:
# from app.api.routes import auth, accounts, scheduler
# api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
# api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
# api_router.include_router(scheduler.router, prefix="/scheduler", tags=["scheduler"])
