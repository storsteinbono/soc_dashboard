"""
Module management endpoints
"""
from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any, List

router = APIRouter()


@router.get("/modules")
async def list_modules(request: Request) -> Dict[str, Any]:
    """
    List all loaded modules and their status
    """
    module_loader = request.app.state.module_loader
    modules = module_loader.get_all_modules()

    module_list = []
    for name, module in modules.items():
        try:
            info = await module.get_info()
            module_list.append({
                "name": name,
                "info": info.dict(),
                "status": module.get_status()
            })
        except Exception as e:
            module_list.append({
                "name": name,
                "error": str(e),
                "status": "error"
            })

    return {
        "total": len(module_list),
        "modules": module_list
    }


@router.get("/modules/{module_name}")
async def get_module_info(module_name: str, request: Request) -> Dict[str, Any]:
    """
    Get detailed information about a specific module
    """
    module_loader = request.app.state.module_loader
    module = module_loader.get_module(module_name)

    if not module:
        raise HTTPException(status_code=404, detail=f"Module {module_name} not found")

    info = await module.get_info()
    capabilities = await module.get_capabilities()
    health = await module.health_check()

    return {
        "name": module_name,
        "info": info.dict(),
        "capabilities": capabilities,
        "health": health,
        "status": module.get_status()
    }


@router.get("/modules/{module_name}/capabilities")
async def get_module_capabilities(module_name: str, request: Request) -> List[Dict[str, Any]]:
    """
    Get capabilities of a specific module
    """
    module_loader = request.app.state.module_loader
    module = module_loader.get_module(module_name)

    if not module:
        raise HTTPException(status_code=404, detail=f"Module {module_name} not found")

    return await module.get_capabilities()
