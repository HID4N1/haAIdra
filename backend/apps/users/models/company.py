from django.db import models
import uuid
from .base import BaseModel

class Company(BaseModel):

    class Plan(models.TextChoices):
        FREE       = "free",       "Free"
        PRO        = "pro",        "Pro"
        ENTERPRISE = "enterprise", "Enterprise"

    name          = models.CharField(max_length=255)
    plan          = models.CharField(max_length=20, choices=Plan.choices, default=Plan.FREE)
    tenant_id     = models.UUIDField(unique=True, default=uuid.uuid4, db_index=True)
    is_active     = models.BooleanField(default=True)
    max_calls     = models.IntegerField(default=100)
    max_users     = models.IntegerField(default=10)
    storage_quota = models.IntegerField(default=5120, help_text="Quota in MB")

    class Meta:
        db_table            = "company"
        verbose_name        = "Company"
        verbose_name_plural = "Companies"
        ordering            = ["name"]

    def __str__(self):
        return f"{self.name} ({self.get_plan_display()})"
