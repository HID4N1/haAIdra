from django.db import models
from apps.users.models.base import BaseModel
from apps.calls.models import Call


class Summary(BaseModel):

    call = models.OneToOneField(Call, on_delete=models.CASCADE,related_name="summary")
    motif = models.TextField(blank=True, default="",help_text="Reason for the call")
    actions = models.TextField(blank=True, default="",help_text="Actions taken during the call")
    outcome = models.TextField(blank=True, default="",help_text="Call outcome")
    recommendations = models.TextField(blank=True, default="",help_text="AI improvement recommendations")

    class Meta:
        db_table            = "summary"
        verbose_name        = "Summary"
        verbose_name_plural = "Summaries"

    def __str__(self):
        return f"Summary({self.call_id})"