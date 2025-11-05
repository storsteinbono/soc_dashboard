"""
TheHive API Routes
"""
from fastapi import APIRouter, Request, HTTPException, Body
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

router = APIRouter()


class CaseCreate(BaseModel):
    """Case creation model"""
    title: str
    description: str
    severity: int = 2
    tlp: int = 2
    tags: Optional[List[str]] = None


class CaseUpdate(BaseModel):
    """Case update model"""
    fields: Dict[str, Any]


class ObservableCreate(BaseModel):
    """Observable creation model"""
    data_type: str
    data: str
    tlp: int = 2
    ioc: bool = False
    tags: Optional[List[str]] = None
    message: str = ""


class TaskCreate(BaseModel):
    """Task creation model"""
    title: str
    description: str = ""


@router.get("/cases")
async def list_cases(
    request: Request,
    limit: int = 10,
    sort: str = "-startDate"
) -> List[Dict[str, Any]]:
    """List cases"""
    module = request.app.state.module_loader.get_module('thehive')
    if not module:
        raise HTTPException(status_code=404, detail="TheHive module not loaded")

    return module.list_cases(limit=limit, sort=sort)


@router.get("/cases/{case_id}")
async def get_case(case_id: str, request: Request) -> Dict[str, Any]:
    """Get case by ID"""
    module = request.app.state.module_loader.get_module('thehive')
    if not module:
        raise HTTPException(status_code=404, detail="TheHive module not loaded")

    case = module.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return case


@router.post("/cases")
async def create_case(case_data: CaseCreate, request: Request) -> Dict[str, Any]:
    """Create a new case"""
    module = request.app.state.module_loader.get_module('thehive')
    if not module:
        raise HTTPException(status_code=404, detail="TheHive module not loaded")

    case = module.create_case(
        title=case_data.title,
        description=case_data.description,
        severity=case_data.severity,
        tlp=case_data.tlp,
        tags=case_data.tags
    )

    if not case:
        raise HTTPException(status_code=500, detail="Failed to create case")

    return case


@router.put("/cases/{case_id}")
async def update_case(
    case_id: str,
    update_data: CaseUpdate,
    request: Request
) -> Dict[str, str]:
    """Update a case"""
    module = request.app.state.module_loader.get_module('thehive')
    if not module:
        raise HTTPException(status_code=404, detail="TheHive module not loaded")

    success = module.update_case(case_id, **update_data.fields)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update case")

    return {"status": "success", "message": "Case updated"}


@router.post("/cases/{case_id}/close")
async def close_case(
    case_id: str,
    request: Request,
    resolution_status: str = "TruePositive",
    summary: str = ""
) -> Dict[str, str]:
    """Close a case"""
    module = request.app.state.module_loader.get_module('thehive')
    if not module:
        raise HTTPException(status_code=404, detail="TheHive module not loaded")

    success = module.close_case(case_id, resolution_status, summary)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to close case")

    return {"status": "success", "message": "Case closed"}


@router.get("/alerts")
async def list_alerts(request: Request, limit: int = 10) -> List[Dict[str, Any]]:
    """List alerts"""
    module = request.app.state.module_loader.get_module('thehive')
    if not module:
        raise HTTPException(status_code=404, detail="TheHive module not loaded")

    return module.list_alerts(limit=limit)


@router.post("/alerts/{alert_id}/promote")
async def promote_alert(alert_id: str, request: Request) -> Dict[str, Any]:
    """Promote an alert to a case"""
    module = request.app.state.module_loader.get_module('thehive')
    if not module:
        raise HTTPException(status_code=404, detail="TheHive module not loaded")

    case = module.promote_alert_to_case(alert_id)
    if not case:
        raise HTTPException(status_code=500, detail="Failed to promote alert")

    return case


@router.post("/cases/{case_id}/observables")
async def add_observable(
    case_id: str,
    observable_data: ObservableCreate,
    request: Request
) -> Dict[str, Any]:
    """Add an observable to a case"""
    module = request.app.state.module_loader.get_module('thehive')
    if not module:
        raise HTTPException(status_code=404, detail="TheHive module not loaded")

    observable = module.add_observable(
        case_id=case_id,
        data_type=observable_data.data_type,
        data=observable_data.data,
        tlp=observable_data.tlp,
        ioc=observable_data.ioc,
        tags=observable_data.tags,
        message=observable_data.message
    )

    if not observable:
        raise HTTPException(status_code=500, detail="Failed to add observable")

    return observable


@router.post("/cases/{case_id}/tasks")
async def create_task(
    case_id: str,
    task_data: TaskCreate,
    request: Request
) -> Dict[str, Any]:
    """Create a task in a case"""
    module = request.app.state.module_loader.get_module('thehive')
    if not module:
        raise HTTPException(status_code=404, detail="TheHive module not loaded")

    task = module.create_task(
        case_id=case_id,
        title=task_data.title,
        description=task_data.description
    )

    if not task:
        raise HTTPException(status_code=500, detail="Failed to create task")

    return task


@router.post("/cases/search")
async def search_cases(
    request: Request,
    query: Dict[str, Any] = Body(...)
) -> List[Dict[str, Any]]:
    """Search cases with custom query"""
    module = request.app.state.module_loader.get_module('thehive')
    if not module:
        raise HTTPException(status_code=404, detail="TheHive module not loaded")

    return module.search_cases(query)
