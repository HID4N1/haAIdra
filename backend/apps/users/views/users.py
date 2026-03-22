import logging
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.users.models import User, Agent
from apps.users.serializers import (
    UserSerializer, UserUpdateSerializer, UserAdminSerializer,
    AgentSerializer, AgentUpdateSerializer,
)
from apps.users.permissions import IsAdmin, IsManager, IsQASupervisor
from core.mixins import TenantScopedMixin

logger = logging.getLogger(__name__)


class UserViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    GET    /api/users/        — list users in own company
    POST   /api/users/        — create user in own company
    GET    /api/users/{id}/   — user detail
    PATCH  /api/users/{id}/   — update user
    DELETE /api/users/{id}/   — soft-delete user
    """
    permission_classes = [IsManager]
    queryset           = User.objects.select_related("company").all()

    def get_serializer_class(self):
        if self.request.user.is_admin:
            return UserAdminSerializer
        if self.action in ("update", "partial_update"):
            return UserUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        qs   = super().get_queryset()
        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)
        return qs

    def perform_destroy(self, instance):
        instance.soft_delete()


class UserAdminViewSet(viewsets.ModelViewSet):
    """
    Admin-only — full cross-tenant user management.
    GET/POST        /api/admin/users/
    GET/PATCH/DELETE /api/admin/users/{id}/
    """
    permission_classes = [IsAdmin]
    serializer_class   = UserAdminSerializer
    queryset           = User.all_objects.select_related("company").all()

    def perform_destroy(self, instance):
        instance.soft_delete()


class AgentViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    GET   /api/agents/        — list agents in company
    GET   /api/agents/{id}/   — agent detail
    PATCH /api/agents/{id}/   — update department / status / coaching notes
    """
    permission_classes = [IsQASupervisor]
    queryset           = Agent.objects.select_related("user", "company").all()
    tenant_field       = "company"

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return AgentUpdateSerializer
        return AgentSerializer

    def get_queryset(self):
        qs            = super().get_queryset()
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.order_by("-avg_score")

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=["patch"], permission_classes=[IsManager])
    def coaching(self, request, pk=None):
        """PATCH /api/agents/{id}/coaching/"""
        agent = self.get_object()
        agent.coaching_notes = request.data.get("coaching_notes", agent.coaching_notes)
        agent.save(update_fields=["coaching_notes", "updated_at"])
        return Response(AgentSerializer(agent).data)