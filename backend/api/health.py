"""
Health check endpoints
"""
from fastapi import APIRouter, Request
from typing import Dict, Any

router = APIRouter()


@router.get("/health")
async def health_check(request: Request) -> Dict[str, Any]:
    """
    Overall system health check

    Returns health status of the application and all loaded modules
    """
    module_loader = request.app.state.module_loader
    modules = module_loader.get_all_modules()

    module_health = {}
    for name, module in modules.items():
        try:
            health = await module.health_check()
            module_health[name] = health
        except Exception as e:
            module_health[name] = {
                "status": "error",
                "error": str(e)
            }

    return {
        "status": "healthy",
        "modules_loaded": len(modules),
        "modules": module_health
    }
