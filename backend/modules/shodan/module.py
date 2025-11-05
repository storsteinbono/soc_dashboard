"""
Shodan Integration Module
Internet-wide asset discovery and vulnerability scanning
"""
from typing import Dict, Any, List, Optional
import httpx
import logging

from core.base_module import BaseModule, ModuleInfo, ModuleStatus, ModuleCapability

logger = logging.getLogger(__name__)


class ShodanModule(BaseModule):
    """
    Shodan Integration for Asset Discovery

    Provides internet scanning capabilities:
    - Host lookup
    - Search for devices/services
    - DNS lookup
    - Exploit search
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.api_key = ""
        self.base_url = "https://api.shodan.io"
        self.timeout = 30

    async def get_info(self) -> ModuleInfo:
        """Get module information"""
        return ModuleInfo(
            name="Shodan",
            version="1.0.0",
            description="Internet-wide asset discovery and vulnerability scanning",
            author="SOC Dashboard",
            capabilities=[
                ModuleCapability.NETWORK_ANALYSIS,
                ModuleCapability.THREAT_INTELLIGENCE
            ],
            requires_api_key=True,
            status=self.status
        )

    async def initialize(self) -> bool:
        """Initialize Shodan connection"""
        try:
            self.api_key = self.get_config_value('api_key', '')
            self.timeout = self.get_config_value('timeout', 30)

            if not self.api_key:
                logger.error("Shodan API key not configured")
                self.status = ModuleStatus.ERROR
                return False

            health = await self.health_check()
            if health['status'] == 'healthy':
                self.status = ModuleStatus.ACTIVE
                self._initialized = True
                logger.info("Shodan module initialized successfully")
                return True
            else:
                self.status = ModuleStatus.ERROR
                return False

        except Exception as e:
            logger.error(f"Failed to initialize Shodan module: {str(e)}")
            self.status = ModuleStatus.ERROR
            return False

    async def health_check(self) -> Dict[str, Any]:
        """Check Shodan connectivity"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/api-info",
                    params={"key": self.api_key}
                )

                if response.status_code == 200:
                    return {"status": "healthy", "message": "Connected to Shodan"}
                else:
                    return {"status": "unhealthy", "message": f"Status code {response.status_code}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def get_capabilities(self) -> List[Dict[str, Any]]:
        """List all capabilities"""
        return [
            {
                "name": "host_lookup",
                "description": "Look up host information",
                "endpoint": "/api/v1/shodan/host/{ip}",
                "method": "GET"
            },
            {
                "name": "search",
                "description": "Search Shodan",
                "endpoint": "/api/v1/shodan/search",
                "method": "POST"
            },
            {
                "name": "dns_lookup",
                "description": "DNS lookup",
                "endpoint": "/api/v1/shodan/dns/{hostname}",
                "method": "GET"
            },
            {
                "name": "exploit_search",
                "description": "Search for exploits",
                "endpoint": "/api/v1/shodan/exploits/search",
                "method": "POST"
            }
        ]

    async def host_lookup(self, ip: str) -> Optional[Dict[str, Any]]:
        """
        Look up host information

        Args:
            ip: IP address

        Returns:
            Host information
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/shodan/host/{ip}",
                    params={"key": self.api_key}
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to lookup host: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error looking up host: {str(e)}")
            return None

    async def search(self, query: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Search Shodan

        Args:
            query: Search query
            limit: Maximum results

        Returns:
            Search results
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/shodan/host/search",
                    params={
                        "key": self.api_key,
                        "query": query,
                        "limit": limit
                    }
                )

                if response.status_code == 200:
                    return response.json().get('matches', [])
                else:
                    logger.error(f"Failed to search: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error searching: {str(e)}")
            return []

    async def dns_lookup(self, hostname: str) -> Optional[Dict[str, Any]]:
        """
        DNS lookup

        Args:
            hostname: Hostname to resolve

        Returns:
            DNS information
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/dns/resolve",
                    params={
                        "key": self.api_key,
                        "hostnames": hostname
                    }
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed DNS lookup: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error in DNS lookup: {str(e)}")
            return None

    async def exploit_search(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for exploits

        Args:
            query: Search query

        Returns:
            List of exploits
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/exploits/search",
                    params={
                        "key": self.api_key,
                        "query": query
                    }
                )

                if response.status_code == 200:
                    return response.json().get('matches', [])
                else:
                    logger.error(f"Failed exploit search: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error searching exploits: {str(e)}")
            return []
