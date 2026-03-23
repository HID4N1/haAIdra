from django.db import models
from apps.users.models.base import BaseModel
from apps.calls.models import Call


class Transcript(BaseModel):

    call = models.OneToOneField(Call, on_delete=models.CASCADE,related_name="transcript")
    language_detected = models.CharField(max_length=10, blank=True, default="",db_index=True)
    word_error_rate  = models.FloatField(default=0.0)
    duration = models.FloatField(default=0.0, help_text="Duration in seconds")
    segments = models.JSONField(default=list, blank=True,help_text="List of {start, end, speaker, text} dicts")

    class Meta:
        db_table            = "transcript"
        verbose_name        = "Transcript"
        verbose_name_plural = "Transcripts"

    def __str__(self):
        return f"Transcript({self.call_id}, lang={self.language_detected})"