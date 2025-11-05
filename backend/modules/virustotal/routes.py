"""
VirusTotal API Routes
"""
from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any, List
from pydantic import BaseModel

router = APIRouter()


class URLScan(BaseModel):
    """URL scan model"""
    url: str


class SearchQuery(BaseModel):
    """Search query model"""
    query: str


@router.get("/files/{file_hash}")
async def analyze_file_hash(file_hash: str, request: Request) -> Dict[str, Any]:
    """Analyze a file hash"""
    module = request.app.state.module_loader.get_module('virustotal')
    if not module:
        raise HTTPException(status_code=404, detail="VirusTotal module not loaded")

    result = await module.analyze_file_hash(file_hash)
    if not result:
        raise HTTPException(status_code=404, detail="Hash not found")

    return result


@router.post("/urls")
async def scan_url(url_data: URLScan, request: Request) -> Dict[str, Any]:
    """Scan a URL"""
    module = request.app.state.module_loader.get_module('virustotal')
    if not module:
        raise HTTPException(status_code=404, detail="VirusTotal module not loaded")

    result = await module.scan_url(url_data.url)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to scan URL")

    return result


@router.get("/ip/{ip}")
async def analyze_ip(ip: str, request: Request) -> Dict[str, Any]:
    """Analyze an IP address"""
    module = request.app.state.module_loader.get_module('virustotal')
    if not module:
        raise HTTPException(status_code=404, detail="VirusTotal module not loaded")

    result = await module.analyze_ip(ip)
    if not result:
        raise HTTPException(status_code=404, detail="IP not found")

    return result


@router.get("/domains/{domain}")
async def analyze_domain(domain: str, request: Request) -> Dict[str, Any]:
    """Analyze a domain"""
    module = request.app.state.module_loader.get_module('virustotal')
    if not module:
        raise HTTPException(status_code=404, detail="VirusTotal module not loaded")

    result = await module.analyze_domain(domain)
    if not result:
        raise HTTPException(status_code=404, detail="Domain not found")

    return result


@router.post("/search")
async def search(query_data: SearchQuery, request: Request) -> List[Dict[str, Any]]:
    """Search VirusTotal intelligence"""
    module = request.app.state.module_loader.get_module('virustotal')
    if not module:
        raise HTTPException(status_code=404, detail="VirusTotal module not loaded")

    return await module.search(query_data.query)
