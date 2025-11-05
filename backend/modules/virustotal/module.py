"""
VirusTotal Integration Module
Threat intelligence for files, URLs, IPs, and domains
"""
from typing import Dict, Any, List, Optional
import httpx
import logging

from core.base_module import BaseModule, ModuleInfo, ModuleStatus, ModuleCapability

logger = logging.getLogger(__name__)


class VirustotalModule(BaseModule):
    """
    VirusTotal Integration for Threat Intelligence

    Provides threat analysis capabilities:
    - File hash analysis
    - URL scanning
    - IP reputation
    - Domain analysis
    - Search capabilities
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.api_key = ""
        self.base_url = "https://www.virustotal.com/api/v3"
        self.timeout = 30

    async def get_info(self) -> ModuleInfo:
        """Get module information"""
        return ModuleInfo(
            name="VirusTotal",
            version="1.0.0",
            description="Threat intelligence for files, URLs, IPs, and domains",
            author="SOC Dashboard",
            capabilities=[
                ModuleCapability.THREAT_INTELLIGENCE,
                ModuleCapability.REPUTATION
            ],
            requires_api_key=True,
            status=self.status
        )

    async def initialize(self) -> bool:
        """Initialize VirusTotal connection"""
        try:
            self.api_key = self.get_config_value('api_key', '')
            self.timeout = self.get_config_value('timeout', 30)

            if not self.api_key:
                logger.error("VirusTotal API key not configured")
                self.status = ModuleStatus.ERROR
                return False

            health = await self.health_check()
            if health['status'] == 'healthy':
                self.status = ModuleStatus.ACTIVE
                self._initialized = True
                logger.info("VirusTotal module initialized successfully")
                return True
            else:
                self.status = ModuleStatus.ERROR
                return False

        except Exception as e:
            logger.error(f"Failed to initialize VirusTotal module: {str(e)}")
            self.status = ModuleStatus.ERROR
            return False

    async def health_check(self) -> Dict[str, Any]:
        """Check VirusTotal connectivity"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/users/current",
                    headers=self._get_headers()
                )

                if response.status_code == 200:
                    return {"status": "healthy", "message": "Connected to VirusTotal"}
                else:
                    return {"status": "unhealthy", "message": f"Status code {response.status_code}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def get_capabilities(self) -> List[Dict[str, Any]]:
        """List all capabilities"""
        return [
            {
                "name": "analyze_file_hash",
                "description": "Analyze a file hash",
                "endpoint": "/api/v1/virustotal/files/{hash}",
                "method": "GET"
            },
            {
                "name": "scan_url",
                "description": "Scan a URL",
                "endpoint": "/api/v1/virustotal/urls",
                "method": "POST"
            },
            {
                "name": "analyze_ip",
                "description": "Analyze an IP address",
                "endpoint": "/api/v1/virustotal/ip/{ip}",
                "method": "GET"
            },
            {
                "name": "analyze_domain",
                "description": "Analyze a domain",
                "endpoint": "/api/v1/virustotal/domains/{domain}",
                "method": "GET"
            },
            {
                "name": "search",
                "description": "Search VirusTotal intelligence",
                "endpoint": "/api/v1/virustotal/search",
                "method": "POST"
            }
        ]

    def _get_headers(self) -> Dict[str, str]:
        """Get API request headers"""
        return {
            "x-apikey": self.api_key,
            "Accept": "application/json"
        }

    async def analyze_file_hash(self, file_hash: str) -> Optional[Dict[str, Any]]:
        """Analyze a file hash"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/files/{file_hash}",
                    headers=self._get_headers()
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to analyze hash: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error analyzing hash: {str(e)}")
            return None

    async def scan_url(self, url: str) -> Optional[Dict[str, Any]]:
        """Scan a URL"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/urls",
                    headers=self._get_headers(),
                    data={"url": url}
                )

                if response.status_code in [200, 201]:
                    return response.json()
                else:
                    logger.error(f"Failed to scan URL: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error scanning URL: {str(e)}")
            return None

    async def analyze_ip(self, ip: str) -> Optional[Dict[str, Any]]:
        """Analyze an IP address"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/ip_addresses/{ip}",
                    headers=self._get_headers()
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to analyze IP: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error analyzing IP: {str(e)}")
            return None

    async def analyze_domain(self, domain: str) -> Optional[Dict[str, Any]]:
        """Analyze a domain"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/domains/{domain}",
                    headers=self._get_headers()
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to analyze domain: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error analyzing domain: {str(e)}")
            return None

    async def search(self, query: str) -> List[Dict[str, Any]]:
        """Search VirusTotal intelligence"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/intelligence/search",
                    headers=self._get_headers(),
                    params={"query": query}
                )

                if response.status_code == 200:
                    return response.json().get('data', [])
                else:
                    logger.error(f"Failed to search: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error searching: {str(e)}")
            return []
