from django.db import models
from .base import BaseModel
from .company import Company
from .user import User



class Agent(BaseModel):

    class Status(models.TextChoices):
        ACTIVE   = "active",   "Active"
        INACTIVE = "inactive", "Inactive"

    user    = models.OneToOneField(User, on_delete=models.CASCADE,
                                   related_name="agent_profile")
    company = models.ForeignKey(Company, on_delete=models.PROTECT,
                                related_name="agents", db_index=True)

    department     = models.CharField(max_length=100, blank=True, default="")
    hire_date      = models.DateField(null=True, blank=True)
    status         = models.CharField(max_length=20, choices=Status.choices,
                                      default=Status.ACTIVE, db_index=True)
    total_calls    = models.IntegerField(default=0)
    avg_score      = models.FloatField(default=0.0)
    coaching_notes = models.TextField(blank=True, default="")

    class Meta:
        db_table            = "agent"
        verbose_name        = "Agent"
        verbose_name_plural = "Agents"
        indexes = [
            models.Index(fields=["company", "status"]),
            models.Index(fields=["company", "avg_score"]),
        ]

    def __str__(self):
        return f"Agent({self.user.email})"

