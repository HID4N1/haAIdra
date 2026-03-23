from django.db import models
from apps.users.models.base import BaseModel
from apps.calls.models import Call


class Topic(BaseModel):

    call = models.OneToOneField(Call, on_delete=models.CASCADE,related_name="topic")
    topics = models.JSONField(default=list, blank=True,help_text="List of {label, score} dicts")

    class Meta:
        db_table            = "topic"
        verbose_name        = "Topic"
        verbose_name_plural = "Topics"

    def __str__(self):
        return f"Topic({self.call_id})"