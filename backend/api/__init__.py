"""
API Routes for SOC Dashboard
"""
from .health import router as health_router
from .modules import router as modules_router

__all__ = ['health_router', 'modules_router']
