from django.db import models
from apps.users.models.base import BaseModel
from .calls import Call


class PipelineJob(BaseModel):

    class Status(models.TextChoices):
        QUEUED  = "queued",  "Queued"
        RUNNING = "running", "Running"
        DONE    = "done",    "Done"
        FAILED  = "failed",  "Failed"

    class Step(models.TextChoices):
        TRANSCRIPTION = "transcription", "Transcription"
        SENTIMENT     = "sentiment",     "Sentiment"
        TOPICS        = "topics",        "Topics"
        SCORING       = "scoring",       "Scoring"
        SUMMARY       = "summary",       "Summary"

    call         = models.OneToOneField(Call, on_delete=models.CASCADE,related_name="pipeline_job")
    status       = models.CharField(max_length=20, choices=Status.choices,default=Status.QUEUED, db_index=True)
    current_step = models.CharField(max_length=20, choices=Step.choices,null=True, blank=True, db_index=True)
    retry_count  = models.IntegerField(default=0)
    error_message= models.TextField(blank=True, default="")
    started_at   = models.DateTimeField(null=True, blank=True, db_index=True)
    finished_at   = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table            = "pipeline_job"
        verbose_name        = "Pipeline Job"
        verbose_name_plural = "Pipeline Jobs"
        indexes = [
            models.Index(fields=["status", "current_step"]),
        ]

    def __str__(self):
        return f"PipelineJob({self.call_id}, {self.status}, {self.current_step})"