"""
Configuration Management for SOC Dashboard
"""
from pydantic_settings import BaseSettings
from typing import Dict, Any
import yaml
from pathlib import Path


class Settings(BaseSettings):
    """Application settings"""

    # Application
    app_name: str = "SOC Dashboard"
    app_version: str = "1.0.0"
    debug: bool = False

    # API
    api_prefix: str = "/api/v1"
    cors_origins: list = ["http://localhost:3000", "http://localhost:8000"]

    # Security
    secret_key: str = "change-this-to-a-secure-secret-key"
    access_token_expire_minutes: int = 60

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


def load_module_configs(config_file: str = "config.yaml") -> Dict[str, Dict[str, Any]]:
    """
    Load module configurations from YAML file

    Args:
        config_file: Path to configuration file

    Returns:
        Dictionary of module configurations
    """
    config_path = Path(__file__).parent.parent / config_file

    if not config_path.exists():
        return {}

    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    return config.get('modules', {})


settings = Settings()
