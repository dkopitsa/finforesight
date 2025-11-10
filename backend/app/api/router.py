from fastapi import APIRouter

from app.api.routes import accounts, auth, categories
from app.core.config import settings

api_router = APIRouter()


@api_router.get("/health")
async def api_health_check() -> dict[str, str]:
    """API health check endpoint."""
    return {"status": "healthy", "api_version": "v1"}


# Include authentication routes
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Include account routes
api_router.include_router(accounts.router, prefix="/accounts", tags=["Accounts"])

# Include category routes
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])

# Include test routes in debug mode
if settings.DEBUG:
    from app.api.routes import test

    api_router.include_router(test.router, prefix="/test", tags=["Testing"])


# Future routers will be included here
# Example:
# from app.api.routes import accounts, scheduler
# api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
# api_router.include_router(scheduler.router, prefix="/scheduler", tags=["scheduler"])
