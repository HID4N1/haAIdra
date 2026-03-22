from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return Response(
            {
                "success": False,
                "error": {
                    "code":    "internal_server_error",
                    "message": "An unexpected error occurred.",
                    "detail":  str(exc),
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    detail = response.data

    if isinstance(detail, dict) and "detail" in detail:
        message     = str(detail["detail"])
        field_errors = None
    elif isinstance(detail, dict):
        message     = "Validation failed."
        field_errors = detail
    elif isinstance(detail, list):
        message     = str(detail[0]) if detail else "An error occurred."
        field_errors = None
    else:
        message     = str(detail)
        field_errors = None

    code_map = {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        405: "method_not_allowed",
        409: "conflict",
        429: "too_many_requests",
        500: "internal_server_error",
    }

    response.data = {
        "success": False,
        "error": {
            "code":    code_map.get(response.status_code, "error"),
            "message": message,
            "detail":  field_errors,
        },
    }

    return response