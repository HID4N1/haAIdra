import logging
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.users.models import Company, ScoringConfig
from apps.users.serializers import CompanySerializer, ScoringConfigSerializer
from apps.users.permissions import IsAdmin

logger = logging.getLogger(__name__)


class CompanyViewSet(viewsets.ModelViewSet):
    """
    Admin-only CRUD for Company tenants.
    GET/POST        /api/companies/
    GET/PATCH/DELETE /api/companies/{id}/
    """
    permission_classes = [IsAdmin]
    serializer_class   = CompanySerializer
    queryset           = Company.objects.all()

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=["get", "put", "patch"], url_path="scoring")
    def scoring(self, request, pk=None):
        """
        GET  /api/companies/{id}/scoring/ — get active scoring config
        PUT  /api/companies/{id}/scoring/ — replace scoring config
        PATCH /api/companies/{id}/scoring/ — partial update scoring config
        """
        company = self.get_object()

        config, _ = ScoringConfig.objects.get_or_create(
            company=company,
            is_active=True,
            defaults={},
        )

        if request.method == "GET":
            return Response(ScoringConfigSerializer(config).data)

        serializer = ScoringConfigSerializer(
            config,
            data=request.data,
            partial=request.method == "PATCH",
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ScoringConfigSerializer(config).data)