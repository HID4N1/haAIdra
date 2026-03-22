from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ("admin", "manager")
        )


class IsQASupervisor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ("admin", "manager", "qa_supervisor")
        )


class IsAgent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated


class IsSameCompany(BasePermission):
    """Object-level check — user must belong to the same company as the object."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        company = getattr(obj, "company", None) or getattr(obj, "company_id", None)
        return str(company) == str(request.user.company_id)