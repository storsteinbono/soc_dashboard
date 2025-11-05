"""
AbuseIPDB Integration Module
IP reputation and abuse reporting
"""
from typing import Dict, Any, List, Optional
import httpx
import logging

from core.base_module import BaseModule, ModuleInfo, ModuleStatus, ModuleCapability

logger = logging.getLogger(__name__)


class AbuseipdbModule(BaseModule):
    """
    AbuseIPDB Integration for IP Reputation

    Provides IP reputation capabilities:
    - Check IP reputation
    - Report malicious IPs
    - Get blacklist
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.api_key = ""
        self.base_url = "https://api.abuseipdb.com/api/v2"
        self.timeout = 30

    async def get_info(self) -> ModuleInfo:
        """Get module information"""
        return ModuleInfo(
            name="AbuseIPDB",
            version="1.0.0",
            description="IP reputation checking and abuse reporting",
            author="SOC Dashboard",
            capabilities=[
                ModuleCapability.REPUTATION,
                ModuleCapability.THREAT_INTELLIGENCE
            ],
            requires_api_key=True,
            status=self.status
        )

    async def initialize(self) -> bool:
        """Initialize AbuseIPDB connection"""
        try:
            self.api_key = self.get_config_value('api_key', '')
            self.timeout = self.get_config_value('timeout', 30)

            if not self.api_key:
                logger.error("AbuseIPDB API key not configured")
                self.status = ModuleStatus.ERROR
                return False

            health = await self.health_check()
            if health['status'] == 'healthy':
                self.status = ModuleStatus.ACTIVE
                self._initialized = True
                logger.info("AbuseIPDB module initialized successfully")
                return True
            else:
                self.status = ModuleStatus.ERROR
                return False

        except Exception as e:
            logger.error(f"Failed to initialize AbuseIPDB module: {str(e)}")
            self.status = ModuleStatus.ERROR
            return False

    async def health_check(self) -> Dict[str, Any]:
        """Check AbuseIPDB connectivity"""
        try:
            # Test with a known safe IP
            result = await self.check_ip("8.8.8.8")
            if result:
                return {"status": "healthy", "message": "Connected to AbuseIPDB"}
            else:
                return {"status": "unhealthy", "message": "Failed to query AbuseIPDB"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def get_capabilities(self) -> List[Dict[str, Any]]:
        """List all capabilities"""
        return [
            {
                "name": "check_ip",
                "description": "Check IP reputation",
                "endpoint": "/api/v1/abuseipdb/check/{ip}",
                "method": "GET"
            },
            {
                "name": "report_ip",
                "description": "Report malicious IP",
                "endpoint": "/api/v1/abuseipdb/report",
                "method": "POST"
            },
            {
                "name": "get_blacklist",
                "description": "Get blacklisted IPs",
                "endpoint": "/api/v1/abuseipdb/blacklist",
                "method": "GET"
            }
        ]

    def _get_headers(self) -> Dict[str, str]:
        """Get API request headers"""
        return {
            "Key": self.api_key,
            "Accept": "application/json"
        }

    async def check_ip(self, ip: str, max_age_days: int = 90) -> Optional[Dict[str, Any]]:
        """
        Check IP reputation

        Args:
            ip: IP address to check
            max_age_days: Maximum age of reports to consider

        Returns:
            IP reputation data
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/check",
                    headers=self._get_headers(),
                    params={
                        "ipAddress": ip,
                        "maxAgeInDays": max_age_days,
                        "verbose": True
                    }
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to check IP: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error checking IP: {str(e)}")
            return None

    async def report_ip(
        self,
        ip: str,
        categories: List[int],
        comment: str = ""
    ) -> bool:
        """
        Report malicious IP

        Args:
            ip: IP address to report
            categories: Abuse categories (list of category IDs)
            comment: Comment about the abuse

        Returns:
            True if successful
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/report",
                    headers=self._get_headers(),
                    data={
                        "ip": ip,
                        "categories": ",".join(map(str, categories)),
                        "comment": comment
                    }
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Error reporting IP: {str(e)}")
            return False

    async def get_blacklist(self, confidence_minimum: int = 90) -> List[Dict[str, Any]]:
        """
        Get blacklisted IPs

        Args:
            confidence_minimum: Minimum confidence score (0-100)

        Returns:
            List of blacklisted IPs
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/blacklist",
                    headers=self._get_headers(),
                    params={"confidenceMinimum": confidence_minimum}
                )

                if response.status_code == 200:
                    return response.json().get('data', [])
                else:
                    logger.error(f"Failed to get blacklist: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error getting blacklist: {str(e)}")
            return []
