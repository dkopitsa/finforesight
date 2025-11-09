# Error Handling Documentation

## Overview

The application implements a comprehensive error handling system that catches all exceptions and returns standardized JSON error responses.

## Error Response Format

All errors return a consistent JSON structure:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error message",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "type": "value_error"
    }
  ],
  "path": "/api/v1/endpoint",
  "timestamp": "2025-11-09T12:00:00Z"
}
```

## Custom Exceptions

Located in `app/core/exceptions.py`:

### Base Exception

- **AppException** - Base class for all application exceptions
  - Properties: `message`, `status_code`

### HTTP Exceptions

- **NotFoundException (404)** - Resource not found
- **BadRequestException (400)** - Invalid request
- **UnauthorizedException (401)** - Not authenticated
- **ForbiddenException (403)** - No permission
- **ConflictException (409)** - Resource conflict (duplicate)
- **ValidationException (422)** - Validation errors

### Usage Example

```python
from app.core.exceptions import NotFoundException

async def get_user(user_id: int):
    user = await db.get(User, user_id)
    if not user:
        raise NotFoundException(f"User {user_id} not found")
    return user
```

## Exception Handlers

Located in `app/core/errors.py`:

### 1. Application Exception Handler
Handles all custom `AppException` instances.

### 2. Validation Exception Handler
Handles Pydantic validation errors (`RequestValidationError`, `ValidationError`).

Returns detailed validation errors with field names.

### 3. Database Exception Handler
Handles SQLAlchemy errors:
- **IntegrityError** - Unique/foreign key violations → 409 Conflict
- **Other SQLAlchemyError** - Generic DB errors → 500 Internal Server Error

### 4. Generic Exception Handler
Catches all unhandled exceptions → 500 Internal Server Error

Logs full traceback for debugging.

## Error Logging

All errors are automatically logged with appropriate levels:
- **AppException** - WARNING level
- **ValidationError** - WARNING level
- **DatabaseError** - ERROR level
- **Unhandled Exception** - ERROR level with traceback

## Testing Error Handlers

In DEBUG mode, test endpoints are available at `/api/v1/test/errors/*`:

- `GET /api/v1/test/errors/400` - Bad Request
- `GET /api/v1/test/errors/401` - Unauthorized
- `GET /api/v1/test/errors/403` - Forbidden
- `GET /api/v1/test/errors/404` - Not Found
- `GET /api/v1/test/errors/409` - Conflict
- `GET /api/v1/test/errors/500` - Internal Server Error

**Note:** Test endpoints are only available when `DEBUG=True` in settings.

## Best Practices

1. **Use specific exceptions** - Use the most appropriate exception class
2. **Provide context** - Include helpful error messages
3. **Don't expose internals** - Don't leak database/system details in production
4. **Log appropriately** - All errors are automatically logged
5. **Validation errors** - Let Pydantic handle model validation

## Example: Creating a New Route

```python
from fastapi import APIRouter, Depends
from app.core.exceptions import NotFoundException, BadRequestException

router = APIRouter()

@router.get("/users/{user_id}")
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    # Input validation
    if user_id < 1:
        raise BadRequestException("User ID must be positive")

    # Database query
    user = await db.get(User, user_id)

    # Not found check
    if not user:
        raise NotFoundException(f"User {user_id} not found")

    return user
```

The error handler will automatically:
- Convert the exception to JSON
- Set the appropriate status code
- Log the error
- Return standardized response

## Security Considerations

- **Production mode**: Generic error messages for 500 errors
- **Debug mode**: More detailed error information (including test endpoints)
- **Sensitive data**: Never include passwords, tokens, or PII in error messages
- **Database errors**: IntegrityError messages are sanitized
