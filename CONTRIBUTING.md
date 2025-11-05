# Contributing to SOC Dashboard

Thank you for your interest in contributing to the SOC Dashboard project! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Adding New Modules](#adding-new-modules)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain professional communication

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/soc_dashboard.git`
3. Create a development branch: `git checkout -b feature/your-feature-name`
4. Set up development environment (see README.md)

## Development Workflow

### Backend Development

1. Install dependencies: `pip install -r backend/requirements.txt`
2. Run in debug mode: Set `DEBUG=true` in `.env`
3. Test your changes
4. Check code style: `flake8 backend/`

### Frontend Development

1. Install dependencies: `npm install` in `frontend/`
2. Run development server: `npm start`
3. Test in browser
4. Check for lint errors: `npm run lint`

## Adding New Modules

### Module Structure

Every module must follow this structure:

```
backend/modules/your_module/
├── __init__.py          # Module package
├── module.py            # Main module class
└── routes.py            # API routes
```

### Module Requirements

Your module class must:

1. Inherit from `BaseModule`
2. Implement all abstract methods:
   - `get_info()`
   - `initialize()`
   - `health_check()`
   - `get_capabilities()`

### Example Module Template

```python
from typing import Dict, Any, List, Optional
from core.base_module import BaseModule, ModuleInfo, ModuleStatus, ModuleCapability

class YourModuleModule(BaseModule):
    """Your module description"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        # Initialize module-specific attributes

    async def get_info(self) -> ModuleInfo:
        return ModuleInfo(
            name="Your Module Name",
            version="1.0.0",
            description="What your module does",
            author="Your Name",
            capabilities=[ModuleCapability.THREAT_INTELLIGENCE],
            requires_api_key=True,
            status=self.status
        )

    async def initialize(self) -> bool:
        try:
            # Module initialization logic
            self.status = ModuleStatus.ACTIVE
            self._initialized = True
            return True
        except Exception as e:
            self.status = ModuleStatus.ERROR
            return False

    async def health_check(self) -> Dict[str, Any]:
        # Check if module is operational
        return {
            "status": "healthy",
            "message": "Module is operational"
        }

    async def get_capabilities(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "feature_name",
                "description": "Feature description",
                "endpoint": "/api/v1/yourmodule/feature",
                "method": "GET"
            }
        ]
```

### Adding Routes

Create `routes.py`:

```python
from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any

router = APIRouter()

@router.get("/feature")
async def feature(request: Request) -> Dict[str, Any]:
    module = request.app.state.module_loader.get_module('your_module')
    if not module:
        raise HTTPException(status_code=404, detail="Module not loaded")

    # Use module functionality
    result = module.your_method()
    return {"result": result}
```

## Coding Standards

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints for all functions
- Document all public methods and classes
- Use async/await for I/O operations
- Handle exceptions appropriately
- Use meaningful variable names

### JavaScript/React (Frontend)

- Use functional components with hooks
- Follow React best practices
- Use meaningful component and variable names
- Add PropTypes or TypeScript types
- Keep components focused and reusable
- Use CSS modules or styled-components

### Documentation

- Add docstrings to all functions and classes
- Update README.md for new features
- Document API endpoints
- Add inline comments for complex logic

## Testing

### Backend Testing

```bash
# Run tests
pytest backend/tests/

# Run with coverage
pytest --cov=backend backend/tests/
```

### Frontend Testing

```bash
# Run tests
cd frontend && npm test

# Run with coverage
npm test -- --coverage
```

### Manual Testing

1. Test all API endpoints using `/docs` (Swagger UI)
2. Test frontend functionality in browser
3. Verify module loading and health checks
4. Test error handling

## Submitting Changes

### Before Submitting

1. Ensure all tests pass
2. Update documentation
3. Follow coding standards
4. Add meaningful commit messages
5. Rebase on latest main branch

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Example:
```
feat(modules): add MISP integration module

- Implement MISP API client
- Add event search functionality
- Include attribute management
- Add comprehensive documentation

Closes #123
```

### Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the documentation
3. Ensure CI/CD pipeline passes
4. Request review from maintainers
5. Address review feedback
6. Squash commits if requested

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated
```

## Module Integration Checklist

When adding a new module:

- [ ] Module class inherits from BaseModule
- [ ] All abstract methods implemented
- [ ] Configuration added to config.yaml
- [ ] Routes registered in main.py
- [ ] API endpoints documented
- [ ] Health check implemented
- [ ] Error handling added
- [ ] Tests written
- [ ] Frontend component added (if needed)
- [ ] README updated

## Questions?

If you have questions:
- Check existing documentation
- Search existing issues
- Create a new issue with your question
- Join our community discussions

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Recognized in documentation

Thank you for contributing to SOC Dashboard!
