"""
LimaCharlie Integration Module
Full EDR and telemetry management
"""
from typing import Dict, Any, List, Optional
import httpx
import logging

from core.base_module import BaseModule, ModuleInfo, ModuleStatus, ModuleCapability

logger = logging.getLogger(__name__)


class LimacharlieModule(BaseModule):
    """
    LimaCharlie Integration for EDR and Telemetry

    Provides comprehensive endpoint security capabilities:
    - Sensor management
    - Detection and Response rules
    - Telemetry querying
    - IOC scanning
    - Process isolation
    - Artifact collection
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.api_key = ""
        self.organization_id = ""
        self.base_url = "https://api.limacharlie.io"
        self.timeout = 30

    async def get_info(self) -> ModuleInfo:
        """Get module information"""
        return ModuleInfo(
            name="LimaCharlie",
            version="1.0.0",
            description="Full EDR and telemetry management with detection and response capabilities",
            author="SOC Dashboard",
            capabilities=[
                ModuleCapability.EDR,
                ModuleCapability.FORENSICS,
                ModuleCapability.AUTOMATION
            ],
            requires_api_key=True,
            status=self.status
        )

    async def initialize(self) -> bool:
        """Initialize LimaCharlie connection"""
        try:
            self.api_key = self.get_config_value('api_key', '')
            self.organization_id = self.get_config_value('organization_id', '')
            self.timeout = self.get_config_value('timeout', 30)

            if not self.api_key or not self.organization_id:
                logger.error("LimaCharlie API key or Organization ID not configured")
                self.status = ModuleStatus.ERROR
                return False

            # Test connection
            health = await self.health_check()
            if health['status'] == 'healthy':
                self.status = ModuleStatus.ACTIVE
                self._initialized = True
                logger.info("LimaCharlie module initialized successfully")
                return True
            else:
                self.status = ModuleStatus.ERROR
                return False

        except Exception as e:
            logger.error(f"Failed to initialize LimaCharlie module: {str(e)}")
            self.status = ModuleStatus.ERROR
            return False

    async def health_check(self) -> Dict[str, Any]:
        """Check LimaCharlie connectivity"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/v1/orgs",
                    headers=self._get_headers()
                )

                if response.status_code == 200:
                    return {
                        "status": "healthy",
                        "message": "Connected to LimaCharlie",
                        "organization": self.organization_id
                    }
                else:
                    return {
                        "status": "unhealthy",
                        "message": f"LimaCharlie returned status code {response.status_code}"
                    }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }

    async def get_capabilities(self) -> List[Dict[str, Any]]:
        """List all capabilities"""
        return [
            {
                "name": "list_sensors",
                "description": "List all sensors in the organization",
                "endpoint": "/api/v1/limacharlie/sensors",
                "method": "GET"
            },
            {
                "name": "get_sensor",
                "description": "Get detailed information about a sensor",
                "endpoint": "/api/v1/limacharlie/sensors/{sensor_id}",
                "method": "GET"
            },
            {
                "name": "isolate_sensor",
                "description": "Isolate a sensor from the network",
                "endpoint": "/api/v1/limacharlie/sensors/{sensor_id}/isolate",
                "method": "POST"
            },
            {
                "name": "rejoin_sensor",
                "description": "Remove sensor isolation",
                "endpoint": "/api/v1/limacharlie/sensors/{sensor_id}/rejoin",
                "method": "POST"
            },
            {
                "name": "query_events",
                "description": "Query telemetry events",
                "endpoint": "/api/v1/limacharlie/events/query",
                "method": "POST"
            },
            {
                "name": "list_detections",
                "description": "List detection events",
                "endpoint": "/api/v1/limacharlie/detections",
                "method": "GET"
            },
            {
                "name": "scan_ioc",
                "description": "Scan for IOCs across sensors",
                "endpoint": "/api/v1/limacharlie/ioc/scan",
                "method": "POST"
            },
            {
                "name": "run_command",
                "description": "Execute a command on a sensor",
                "endpoint": "/api/v1/limacharlie/sensors/{sensor_id}/command",
                "method": "POST"
            },
            {
                "name": "list_processes",
                "description": "List running processes on a sensor",
                "endpoint": "/api/v1/limacharlie/sensors/{sensor_id}/processes",
                "method": "GET"
            },
            {
                "name": "kill_process",
                "description": "Kill a process on a sensor",
                "endpoint": "/api/v1/limacharlie/sensors/{sensor_id}/processes/{pid}/kill",
                "method": "POST"
            }
        ]

    def _get_headers(self) -> Dict[str, str]:
        """Get API request headers"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    # Sensor Management

    async def list_sensors(self) -> List[Dict[str, Any]]:
        """
        List all sensors

        Returns:
            List of sensors
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/v1/{self.organization_id}/sensors",
                    headers=self._get_headers()
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to list sensors: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error listing sensors: {str(e)}")
            return []

    async def get_sensor(self, sensor_id: str) -> Optional[Dict[str, Any]]:
        """
        Get sensor details

        Args:
            sensor_id: Sensor ID

        Returns:
            Sensor details or None
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/v1/{self.organization_id}/sensors/{sensor_id}",
                    headers=self._get_headers()
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to get sensor: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error getting sensor: {str(e)}")
            return None

    async def isolate_sensor(self, sensor_id: str) -> bool:
        """
        Isolate a sensor from the network

        Args:
            sensor_id: Sensor ID

        Returns:
            True if successful
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/v1/{self.organization_id}/sensors/{sensor_id}/isolation",
                    headers=self._get_headers(),
                    json={"state": "isolated"}
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Error isolating sensor: {str(e)}")
            return False

    async def rejoin_sensor(self, sensor_id: str) -> bool:
        """
        Remove sensor isolation

        Args:
            sensor_id: Sensor ID

        Returns:
            True if successful
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/v1/{self.organization_id}/sensors/{sensor_id}/isolation",
                    headers=self._get_headers(),
                    json={"state": "rejoined"}
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Error rejoining sensor: {str(e)}")
            return False

    # Telemetry and Detection

    async def query_events(
        self,
        event_type: Optional[str] = None,
        sensor_id: Optional[str] = None,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Query telemetry events

        Args:
            event_type: Event type filter
            sensor_id: Sensor ID filter
            start_time: Start timestamp
            end_time: End timestamp
            limit: Maximum results

        Returns:
            List of events
        """
        try:
            query = {"limit": limit}
            if event_type:
                query["event_type"] = event_type
            if sensor_id:
                query["sensor_id"] = sensor_id
            if start_time:
                query["start"] = start_time
            if end_time:
                query["end"] = end_time

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/v1/{self.organization_id}/events",
                    headers=self._get_headers(),
                    json=query
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to query events: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error querying events: {str(e)}")
            return []

    async def list_detections(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        List detection events

        Args:
            limit: Maximum results

        Returns:
            List of detections
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/v1/{self.organization_id}/detections",
                    headers=self._get_headers(),
                    params={"limit": limit}
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to list detections: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error listing detections: {str(e)}")
            return []

    # IOC Management

    async def scan_ioc(
        self,
        ioc_type: str,
        ioc_value: str,
        sensor_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Scan for IOCs across sensors

        Args:
            ioc_type: IOC type (hash, ip, domain, etc.)
            ioc_value: IOC value
            sensor_id: Optional specific sensor to scan

        Returns:
            Scan results
        """
        try:
            payload = {
                "type": ioc_type,
                "value": ioc_value
            }
            if sensor_id:
                payload["sensor_id"] = sensor_id

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/v1/{self.organization_id}/ioc/scan",
                    headers=self._get_headers(),
                    json=payload
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to scan IOC: {response.status_code}")
                    return {}
        except Exception as e:
            logger.error(f"Error scanning IOC: {str(e)}")
            return {}

    # Remote Command Execution

    async def run_command(
        self,
        sensor_id: str,
        command: str,
        arguments: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Execute a command on a sensor

        Args:
            sensor_id: Sensor ID
            command: Command to execute
            arguments: Command arguments

        Returns:
            Command result
        """
        try:
            payload = {
                "command": command,
                "arguments": arguments or []
            }

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/v1/{self.organization_id}/sensors/{sensor_id}/task",
                    headers=self._get_headers(),
                    json=payload
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to run command: {response.status_code}")
                    return {}
        except Exception as e:
            logger.error(f"Error running command: {str(e)}")
            return {}

    # Process Management

    async def list_processes(self, sensor_id: str) -> List[Dict[str, Any]]:
        """
        List running processes on a sensor

        Args:
            sensor_id: Sensor ID

        Returns:
            List of processes
        """
        try:
            result = await self.run_command(sensor_id, "os_processes", [])
            return result.get("processes", [])
        except Exception as e:
            logger.error(f"Error listing processes: {str(e)}")
            return []

    async def kill_process(self, sensor_id: str, pid: int) -> bool:
        """
        Kill a process on a sensor

        Args:
            sensor_id: Sensor ID
            pid: Process ID

        Returns:
            True if successful
        """
        try:
            result = await self.run_command(
                sensor_id,
                "os_kill_process",
                [str(pid)]
            )
            return result.get("success", False)
        except Exception as e:
            logger.error(f"Error killing process: {str(e)}")
            return False
