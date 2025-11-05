"""
TheHive Integration Module
Full incident management and case handling
"""
from typing import Dict, Any, List, Optional
from thehive4py.api import TheHiveApi
from thehive4py.models import Case, CaseTask, CaseObservable, Alert
from thehive4py.query import *
import logging

from core.base_module import BaseModule, ModuleInfo, ModuleStatus, ModuleCapability

logger = logging.getLogger(__name__)


class ThehiveModule(BaseModule):
    """
    TheHive Integration for Incident Management

    Provides comprehensive incident handling capabilities:
    - Case management (create, update, search, close)
    - Alert handling
    - Task management
    - Observable management
    - TTP tracking
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.api: Optional[TheHiveApi] = None
        self.api_url = ""
        self.api_key = ""

    async def get_info(self) -> ModuleInfo:
        """Get module information"""
        return ModuleInfo(
            name="TheHive",
            version="1.0.0",
            description="Full incident management and case handling integration with TheHive",
            author="SOC Dashboard",
            capabilities=[
                ModuleCapability.INCIDENT_MANAGEMENT,
                ModuleCapability.AUTOMATION
            ],
            requires_api_key=True,
            status=self.status
        )

    async def initialize(self) -> bool:
        """Initialize TheHive connection"""
        try:
            self.api_url = self.get_config_value('api_url', '')
            self.api_key = self.get_config_value('api_key', '')
            verify_ssl = self.get_config_value('verify_ssl', True)

            if not self.api_url or not self.api_key:
                logger.error("TheHive API URL or API key not configured")
                self.status = ModuleStatus.ERROR
                return False

            # Initialize TheHive API client
            self.api = TheHiveApi(
                self.api_url,
                self.api_key,
                cert=verify_ssl
            )

            # Test connection
            health = await self.health_check()
            if health['status'] == 'healthy':
                self.status = ModuleStatus.ACTIVE
                self._initialized = True
                logger.info("TheHive module initialized successfully")
                return True
            else:
                self.status = ModuleStatus.ERROR
                return False

        except Exception as e:
            logger.error(f"Failed to initialize TheHive module: {str(e)}")
            self.status = ModuleStatus.ERROR
            return False

    async def health_check(self) -> Dict[str, Any]:
        """Check TheHive connectivity"""
        if not self.api:
            return {
                "status": "error",
                "message": "API client not initialized"
            }

        try:
            # Try to get current user info as a health check
            response = self.api.get_current_user()
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "message": "Connected to TheHive",
                    "endpoint": self.api_url
                }
            else:
                return {
                    "status": "unhealthy",
                    "message": f"TheHive returned status code {response.status_code}"
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
                "name": "list_cases",
                "description": "List all cases with optional filters",
                "endpoint": "/api/v1/thehive/cases",
                "method": "GET"
            },
            {
                "name": "get_case",
                "description": "Get detailed information about a specific case",
                "endpoint": "/api/v1/thehive/cases/{case_id}",
                "method": "GET"
            },
            {
                "name": "create_case",
                "description": "Create a new case",
                "endpoint": "/api/v1/thehive/cases",
                "method": "POST"
            },
            {
                "name": "update_case",
                "description": "Update an existing case",
                "endpoint": "/api/v1/thehive/cases/{case_id}",
                "method": "PUT"
            },
            {
                "name": "close_case",
                "description": "Close a case",
                "endpoint": "/api/v1/thehive/cases/{case_id}/close",
                "method": "POST"
            },
            {
                "name": "list_alerts",
                "description": "List all alerts",
                "endpoint": "/api/v1/thehive/alerts",
                "method": "GET"
            },
            {
                "name": "promote_alert",
                "description": "Promote an alert to a case",
                "endpoint": "/api/v1/thehive/alerts/{alert_id}/promote",
                "method": "POST"
            },
            {
                "name": "add_observable",
                "description": "Add an observable to a case",
                "endpoint": "/api/v1/thehive/cases/{case_id}/observables",
                "method": "POST"
            },
            {
                "name": "create_task",
                "description": "Create a task in a case",
                "endpoint": "/api/v1/thehive/cases/{case_id}/tasks",
                "method": "POST"
            },
            {
                "name": "search_cases",
                "description": "Search cases with advanced queries",
                "endpoint": "/api/v1/thehive/cases/search",
                "method": "POST"
            }
        ]

    # Case Management Methods

    def list_cases(self, limit: int = 10, sort: str = '-startDate') -> List[Dict[str, Any]]:
        """
        List cases

        Args:
            limit: Maximum number of cases to return
            sort: Sort field (prefix with - for descending)

        Returns:
            List of cases
        """
        try:
            query = And()
            response = self.api.find_cases(
                query=query,
                range=f'0-{limit}',
                sort=[sort]
            )

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to list cases: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"Error listing cases: {str(e)}")
            return []

    def get_case(self, case_id: str) -> Optional[Dict[str, Any]]:
        """
        Get case by ID

        Args:
            case_id: Case ID

        Returns:
            Case details or None
        """
        try:
            response = self.api.get_case(case_id)
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to get case {case_id}: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error getting case: {str(e)}")
            return None

    def create_case(
        self,
        title: str,
        description: str,
        severity: int = 2,
        tlp: int = 2,
        tags: Optional[List[str]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new case

        Args:
            title: Case title
            description: Case description
            severity: Severity (1-4, default 2)
            tlp: TLP level (0-3, default 2)
            tags: List of tags

        Returns:
            Created case or None
        """
        try:
            case = Case(
                title=title,
                description=description,
                severity=severity,
                tlp=tlp,
                tags=tags or []
            )

            response = self.api.create_case(case)
            if response.status_code == 201:
                return response.json()
            else:
                logger.error(f"Failed to create case: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error creating case: {str(e)}")
            return None

    def update_case(self, case_id: str, **fields) -> bool:
        """
        Update case fields

        Args:
            case_id: Case ID
            **fields: Fields to update

        Returns:
            True if successful
        """
        try:
            response = self.api.update_case(case_id, **fields)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error updating case: {str(e)}")
            return False

    def close_case(self, case_id: str, resolution_status: str = "TruePositive", summary: str = "") -> bool:
        """
        Close a case

        Args:
            case_id: Case ID
            resolution_status: Resolution status
            summary: Case summary

        Returns:
            True if successful
        """
        try:
            response = self.api.update_case(
                case_id,
                status='Resolved',
                resolutionStatus=resolution_status,
                summary=summary
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error closing case: {str(e)}")
            return False

    # Alert Management

    def list_alerts(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        List alerts

        Args:
            limit: Maximum number of alerts to return

        Returns:
            List of alerts
        """
        try:
            query = And()
            response = self.api.find_alerts(
                query=query,
                range=f'0-{limit}',
                sort=['-date']
            )

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to list alerts: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"Error listing alerts: {str(e)}")
            return []

    def promote_alert_to_case(self, alert_id: str) -> Optional[Dict[str, Any]]:
        """
        Promote an alert to a case

        Args:
            alert_id: Alert ID

        Returns:
            Created case or None
        """
        try:
            response = self.api.promote_alert_to_case(alert_id)
            if response.status_code == 201:
                return response.json()
            else:
                logger.error(f"Failed to promote alert: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error promoting alert: {str(e)}")
            return None

    # Observable Management

    def add_observable(
        self,
        case_id: str,
        data_type: str,
        data: str,
        tlp: int = 2,
        ioc: bool = False,
        tags: Optional[List[str]] = None,
        message: str = ""
    ) -> Optional[Dict[str, Any]]:
        """
        Add an observable to a case

        Args:
            case_id: Case ID
            data_type: Observable type (ip, domain, hash, etc.)
            data: Observable value
            tlp: TLP level
            ioc: Is Indicator of Compromise
            tags: Tags
            message: Description

        Returns:
            Created observable or None
        """
        try:
            observable = CaseObservable(
                dataType=data_type,
                data=data,
                tlp=tlp,
                ioc=ioc,
                tags=tags or [],
                message=message
            )

            response = self.api.create_case_observable(case_id, observable)
            if response.status_code == 201:
                return response.json()
            else:
                logger.error(f"Failed to add observable: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error adding observable: {str(e)}")
            return None

    # Task Management

    def create_task(self, case_id: str, title: str, description: str = "") -> Optional[Dict[str, Any]]:
        """
        Create a task in a case

        Args:
            case_id: Case ID
            title: Task title
            description: Task description

        Returns:
            Created task or None
        """
        try:
            task = CaseTask(
                title=title,
                description=description
            )

            response = self.api.create_case_task(case_id, task)
            if response.status_code == 201:
                return response.json()
            else:
                logger.error(f"Failed to create task: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error creating task: {str(e)}")
            return None

    def search_cases(self, query_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Search cases with custom query

        Args:
            query_dict: Query parameters

        Returns:
            List of matching cases
        """
        try:
            # Build query from dict
            # This is a simplified version - extend as needed
            response = self.api.find_cases(
                query=query_dict,
                range='0-100',
                sort=['-startDate']
            )

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to search cases: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"Error searching cases: {str(e)}")
            return []
