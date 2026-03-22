from rest_framework.exceptions import PermissionDenied


class TenantScopedMixin:
    """
    Redirect querysets based on user's company
    - users → filtered to their company only (admin is OP)
    """

    tenant_field = "company"  

    def get_queryset(self):
        qs   = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return qs.none()

        if user.is_admin:
            return qs

        if not user.company_id:
            return qs.none()

        return qs.filter(**{self.tenant_field: user.company_id})

    def perform_create(self, serializer):
        """Auto-inject company on create."""
        if not self.request.user.company:
            raise PermissionDenied("User has no associated company.")
        serializer.save(**{self.tenant_field: self.request.user.company})