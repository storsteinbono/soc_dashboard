"""
URLScan.io Integration Module
URL analysis and phishing detection
"""
from typing import Dict, Any, List, Optional
import httpx
import logging
import asyncio

from core.base_module import BaseModule, ModuleInfo, ModuleStatus, ModuleCapability

logger = logging.getLogger(__name__)


class UrlscanModule(BaseModule):
    """
    URLScan.io Integration for URL Analysis

    Provides URL analysis capabilities:
    - Submit URLs for scanning
    - Retrieve scan results
    - Search historical scans
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.api_key = ""
        self.base_url = "https://urlscan.io/api/v1"
        self.timeout = 30

    async def get_info(self) -> ModuleInfo:
        """Get module information"""
        return ModuleInfo(
            name="URLScan.io",
            version="1.0.0",
            description="URL analysis and phishing detection",
            author="SOC Dashboard",
            capabilities=[
                ModuleCapability.THREAT_INTELLIGENCE,
                ModuleCapability.NETWORK_ANALYSIS
            ],
            requires_api_key=True,
            status=self.status
        )

    async def initialize(self) -> bool:
        """Initialize URLScan connection"""
        try:
            self.api_key = self.get_config_value('api_key', '')
            self.timeout = self.get_config_value('timeout', 30)

            if not self.api_key:
                logger.error("URLScan API key not configured")
                self.status = ModuleStatus.ERROR
                return False

            self.status = ModuleStatus.ACTIVE
            self._initialized = True
            logger.info("URLScan module initialized successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize URLScan module: {str(e)}")
            self.status = ModuleStatus.ERROR
            return False

    async def health_check(self) -> Dict[str, Any]:
        """Check URLScan connectivity"""
        try:
            # Try to search for a common domain
            result = await self.search("domain:google.com", limit=1)
            if result is not None:
                return {"status": "healthy", "message": "Connected to URLScan.io"}
            else:
                return {"status": "unhealthy", "message": "Failed to query URLScan.io"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def get_capabilities(self) -> List[Dict[str, Any]]:
        """List all capabilities"""
        return [
            {
                "name": "submit_url",
                "description": "Submit URL for scanning",
                "endpoint": "/api/v1/urlscan/scan",
                "method": "POST"
            },
            {
                "name": "get_result",
                "description": "Get scan results",
                "endpoint": "/api/v1/urlscan/result/{uuid}",
                "method": "GET"
            },
            {
                "name": "search",
                "description": "Search historical scans",
                "endpoint": "/api/v1/urlscan/search",
                "method": "POST"
            }
        ]

    def _get_headers(self) -> Dict[str, str]:
        """Get API request headers"""
        return {
            "API-Key": self.api_key,
            "Content-Type": "application/json"
        }

    async def submit_url(
        self,
        url: str,
        visibility: str = "public",
        tags: Optional[List[str]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Submit URL for scanning

        Args:
            url: URL to scan
            visibility: Scan visibility (public/private/unlisted)
            tags: Optional tags

        Returns:
            Submission result with UUID
        """
        try:
            payload = {
                "url": url,
                "visibility": visibility
            }
            if tags:
                payload["tags"] = tags

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/scan/",
                    headers=self._get_headers(),
                    json=payload
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to submit URL: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error submitting URL: {str(e)}")
            return None

    async def get_result(self, uuid: str, wait_for_completion: bool = False) -> Optional[Dict[str, Any]]:
        """
        Get scan results

        Args:
            uuid: Scan UUID
            wait_for_completion: Wait for scan to complete

        Returns:
            Scan results
        """
        try:
            max_retries = 10 if wait_for_completion else 1
            retry_delay = 5

            for attempt in range(max_retries):
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(
                        f"{self.base_url}/result/{uuid}/",
                        headers=self._get_headers()
                    )

                    if response.status_code == 200:
                        return response.json()
                    elif response.status_code == 404 and wait_for_completion and attempt < max_retries - 1:
                        await asyncio.sleep(retry_delay)
                        continue
                    else:
                        logger.error(f"Failed to get result: {response.status_code}")
                        return None

            return None
        except Exception as e:
            logger.error(f"Error getting result: {str(e)}")
            return None

    async def search(self, query: str, limit: int = 100) -> Optional[List[Dict[str, Any]]]:
        """
        Search historical scans

        Args:
            query: Search query
            limit: Maximum results

        Returns:
            Search results
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/search/",
                    headers=self._get_headers(),
                    params={"q": query, "size": limit}
                )

                if response.status_code == 200:
                    return response.json().get('results', [])
                else:
                    logger.error(f"Failed to search: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error searching: {str(e)}")
            return None
