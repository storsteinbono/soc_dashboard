"""
LimaCharlie API Routes
"""
from fastapi import APIRouter, Request, HTTPException, Body
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

router = APIRouter()


class CommandExecute(BaseModel):
    """Command execution model"""
    command: str
    arguments: Optional[List[str]] = None


class IOCScan(BaseModel):
    """IOC scan model"""
    ioc_type: str
    ioc_value: str
    sensor_id: Optional[str] = None


class EventQuery(BaseModel):
    """Event query model"""
    event_type: Optional[str] = None
    sensor_id: Optional[str] = None
    start_time: Optional[int] = None
    end_time: Optional[int] = None
    limit: int = 100


@router.get("/sensors")
async def list_sensors(request: Request) -> List[Dict[str, Any]]:
    """List all sensors"""
    module = request.app.state.module_loader.get_module('limacharlie')
    if not module:
        raise HTTPException(status_code=404, detail="LimaCharlie module not loaded")

    return await module.list_sensors()


@router.get("/sensors/{sensor_id}")
async def get_sensor(sensor_id: str, request: Request) -> Dict[str, Any]:
    """Get sensor details"""
    module = request.app.state.module_loader.get_module('limacharlie')
    if not module:
        raise HTTPException(status_code=404, detail="LimaCharlie module not loaded")

    sensor = await module.get_sensor(sensor_id)
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")

    return sensor


@router.post("/sensors/{sensor_id}/isolate")
async def isolate_sensor(sensor_id: str, request: Request) -> Dict[str, str]:
    """Isolate a sensor"""
    module = request.app.state.module_loader.get_module('limacharlie')
    if not module:
        raise HTTPException(status_code=404, detail="LimaCharlie module not loaded")

    success = await module.isolate_sensor(sensor_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to isolate sensor")

    return {"status": "success", "message": f"Sensor {sensor_id} isolated"}


@router.post("/sensors/{sensor_id}/rejoin")
async def rejoin_sensor(sensor_id: str, request: Request) -> Dict[str, str]:
    """Remove sensor isolation"""
    module = request.app.state.module_loader.get_module('limacharlie')
    if not module:
        raise HTTPException(status_code=404, detail="LimaCharlie module not loaded")

    success = await module.rejoin_sensor(sensor_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to rejoin sensor")

    return {"status": "success", "message": f"Sensor {sensor_id} rejoined"}


@router.post("/events/query")
async def query_events(query: EventQuery, request: Request) -> List[Dict[str, Any]]:
    """Query telemetry events"""
    module = request.app.state.module_loader.get_module('limacharlie')
    if not module:
        raise HTTPException(status_code=404, detail="LimaCharlie module not loaded")

    return await module.query_events(
        event_type=query.event_type,
        sensor_id=query.sensor_id,
        start_time=query.start_time,
        end_time=query.end_time,
        limit=query.limit
    )


@router.get("/detections")
async def list_detections(request: Request, limit: int = 100) -> List[Dict[str, Any]]:
    """List detection events"""
    module = request.app.state.module_loader.get_module('limacharlie')
    if not module:
        raise HTTPException(status_code=404, detail="LimaCharlie module not loaded")

    return await module.list_detections(limit=limit)


@router.post("/ioc/scan")
async def scan_ioc(scan_data: IOCScan, request: Request) -> Dict[str, Any]:
    """Scan for IOCs"""
    module = request.app.state.module_loader.get_module('limacharlie')
    if not module:
        raise HTTPException(status_code=404, detail="LimaCharlie module not loaded")

    return await module.scan_ioc(
        ioc_type=scan_data.ioc_type,
        ioc_value=scan_data.ioc_value,
        sensor_id=scan_data.sensor_id
    )


@router.post("/sensors/{sensor_id}/command")
async def run_command(
    sensor_id: str,
    command_data: CommandExecute,
    request: Request
) -> Dict[str, Any]:
    """Execute command on sensor"""
    module = request.app.state.module_loader.get_module('limacharlie')
    if not module:
        raise HTTPException(status_code=404, detail="LimaCharlie module not loaded")

    return await module.run_command(
        sensor_id=sensor_id,
        command=command_data.command,
        arguments=command_data.arguments
    )


@router.get("/sensors/{sensor_id}/processes")
async def list_processes(sensor_id: str, request: Request) -> List[Dict[str, Any]]:
    """List processes on sensor"""
    module = request.app.state.module_loader.get_module('limacharlie')
    if not module:
        raise HTTPException(status_code=404, detail="LimaCharlie module not loaded")

    return await module.list_processes(sensor_id)


@router.post("/sensors/{sensor_id}/processes/{pid}/kill")
async def kill_process(sensor_id: str, pid: int, request: Request) -> Dict[str, str]:
    """Kill a process on sensor"""
    module = request.app.state.module_loader.get_module('limacharlie')
    if not module:
        raise HTTPException(status_code=404, detail="LimaCharlie module not loaded")

    success = await module.kill_process(sensor_id, pid)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to kill process")

    return {"status": "success", "message": f"Process {pid} killed"}
