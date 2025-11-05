"""
SOC Dashboard - Main Application
Modular Security Operations Center Dashboard with plugin-based architecture
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from core.config import settings, load_module_configs
from core.module_loader import ModuleLoader
from api import modules_router, health_router

# Import module routes
from modules.thehive.routes import router as thehive_router
from modules.limacharlie.routes import router as limacharlie_router
from modules.virustotal.routes import router as virustotal_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Module loader instance
module_loader = ModuleLoader()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # Startup
    logger.info("Starting SOC Dashboard...")

    # Load module configurations
    module_configs = load_module_configs()
    logger.info(f"Loaded configurations for {len(module_configs)} modules")

    # Load all modules
    results = await module_loader.load_all_modules(module_configs)
    logger.info(f"Module loading results: {results}")

    # Store module loader in app state
    app.state.module_loader = module_loader

    yield

    # Shutdown
    logger.info("Shutting down SOC Dashboard...")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Modular Security Operations Center Dashboard",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, prefix=settings.api_prefix, tags=["Health"])
app.include_router(modules_router, prefix=settings.api_prefix, tags=["Modules"])

# Include module-specific routers
app.include_router(thehive_router, prefix=f"{settings.api_prefix}/thehive", tags=["TheHive"])
app.include_router(limacharlie_router, prefix=f"{settings.api_prefix}/limacharlie", tags=["LimaCharlie"])
app.include_router(virustotal_router, prefix=f"{settings.api_prefix}/virustotal", tags=["VirusTotal"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "operational",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
