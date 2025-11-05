"""
Module Loader - Dynamically loads and manages SOC modules
"""
import importlib
import os
from typing import Dict, List, Type, Optional
from pathlib import Path
import logging

from .base_module import BaseModule, ModuleStatus

logger = logging.getLogger(__name__)


class ModuleLoader:
    """
    Dynamically loads and manages SOC modules
    Provides a registry of available modules
    """

    def __init__(self, modules_path: str = "modules"):
        """
        Initialize the module loader

        Args:
            modules_path: Path to modules directory
        """
        self.modules_path = modules_path
        self.loaded_modules: Dict[str, BaseModule] = {}
        self.available_modules: Dict[str, Type[BaseModule]] = {}

    def discover_modules(self) -> List[str]:
        """
        Discover all available modules in the modules directory

        Returns:
            List of discovered module names
        """
        modules_dir = Path(__file__).parent.parent / self.modules_path
        discovered = []

        if not modules_dir.exists():
            logger.warning(f"Modules directory not found: {modules_dir}")
            return discovered

        for item in modules_dir.iterdir():
            if item.is_dir() and not item.name.startswith('_'):
                # Check if directory contains a module.py file
                module_file = item / "module.py"
                if module_file.exists():
                    discovered.append(item.name)
                    logger.info(f"Discovered module: {item.name}")

        return discovered

    def load_module(self, module_name: str, config: Optional[Dict] = None) -> Optional[BaseModule]:
        """
        Load a specific module

        Args:
            module_name: Name of the module to load
            config: Configuration for the module

        Returns:
            Loaded module instance or None if loading failed
        """
        try:
            # Import the module
            module_path = f"backend.modules.{module_name}.module"
            module = importlib.import_module(module_path)

            # Get the module class (should be named after the module)
            # Convention: module directory name -> ModuleNameModule class
            class_name = ''.join(word.capitalize() for word in module_name.split('_')) + 'Module'

            if not hasattr(module, class_name):
                logger.error(f"Module class {class_name} not found in {module_name}")
                return None

            module_class = getattr(module, class_name)

            # Instantiate the module
            instance = module_class(config=config)

            # Store in registry
            self.available_modules[module_name] = module_class

            logger.info(f"Successfully loaded module: {module_name}")
            return instance

        except Exception as e:
            logger.error(f"Failed to load module {module_name}: {str(e)}")
            return None

    async def initialize_module(self, module_name: str, module: BaseModule) -> bool:
        """
        Initialize a loaded module

        Args:
            module_name: Name of the module
            module: Module instance

        Returns:
            True if initialization successful
        """
        try:
            success = await module.initialize()
            if success:
                self.loaded_modules[module_name] = module
                logger.info(f"Module {module_name} initialized successfully")
            return success
        except Exception as e:
            logger.error(f"Failed to initialize module {module_name}: {str(e)}")
            return False

    def get_module(self, module_name: str) -> Optional[BaseModule]:
        """
        Get a loaded module instance

        Args:
            module_name: Name of the module

        Returns:
            Module instance or None
        """
        return self.loaded_modules.get(module_name)

    def get_all_modules(self) -> Dict[str, BaseModule]:
        """
        Get all loaded modules

        Returns:
            Dictionary of module name to module instance
        """
        return self.loaded_modules.copy()

    async def load_all_modules(self, configs: Dict[str, Dict]) -> Dict[str, bool]:
        """
        Discover and load all available modules

        Args:
            configs: Dictionary mapping module names to their configs

        Returns:
            Dictionary of module name to load success status
        """
        discovered = self.discover_modules()
        results = {}

        for module_name in discovered:
            config = configs.get(module_name, {})
            module = self.load_module(module_name, config)

            if module:
                success = await self.initialize_module(module_name, module)
                results[module_name] = success
            else:
                results[module_name] = False

        return results

    async def reload_module(self, module_name: str, config: Optional[Dict] = None) -> bool:
        """
        Reload a module (useful for config changes)

        Args:
            module_name: Name of module to reload
            config: New configuration

        Returns:
            True if reload successful
        """
        # Unload if already loaded
        if module_name in self.loaded_modules:
            del self.loaded_modules[module_name]

        # Reload
        module = self.load_module(module_name, config)
        if module:
            return await self.initialize_module(module_name, module)
        return False

    def unload_module(self, module_name: str) -> bool:
        """
        Unload a module

        Args:
            module_name: Name of module to unload

        Returns:
            True if unloaded successfully
        """
        if module_name in self.loaded_modules:
            del self.loaded_modules[module_name]
            logger.info(f"Module {module_name} unloaded")
            return True
        return False
