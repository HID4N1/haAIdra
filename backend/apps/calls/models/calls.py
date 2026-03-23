from django.db import models
from apps.users.models.base import BaseModel
from apps.users.models.company import Company
from apps.users.models.agent import Agent
from apps.users.models.user import User


class Call(BaseModel):

    class Language(models.TextChoices):
        FRENCH  = "fr", "French"
        ENGLISH = "en", "English"
        ARABIC  = "ar", "Arabic"

    class Channel(models.TextChoices):
        INBOUND  = "inbound",  "Inbound" #custome calling center
        OUTBOUND = "outbound", "Outbound" #center calling customer

    class FileFormat(models.TextChoices):
        WAV  = "wav",  "WAV"
        MP3  = "mp3",  "MP3"
        M4A  = "m4a",  "M4A"
        FLAC = "flac", "FLAC"
        OGG  = "ogg",  "OGG"

    class Status(models.TextChoices):
        PENDING    = "pending",    "Pending"
        PROCESSING = "processing", "Processing"
        ANALYZED   = "analyzed",   "Analyzed"
        FAILED     = "failed",     "Failed"

    class ResolutionStatus(models.TextChoices):
        RESOLVED   = "resolved",   "Resolved"
        UNRESOLVED = "unresolved", "Unresolved"
        ESCALATED  = "escalated",  "Escalated"

    company     = models.ForeignKey(Company, on_delete=models.PROTECT,related_name="calls", db_index=True)
    agent       = models.ForeignKey(Agent, on_delete=models.PROTECT,related_name="calls", db_index=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.PROTECT,related_name="uploaded_calls")
    client_phone= models.CharField(max_length=30, blank=True, default="", db_index=True)
    language    = models.CharField(max_length=5,  choices=Language.choices, default=Language.FRENCH, db_index=True)
    channel     = models.CharField(max_length=10, choices=Channel.choices,default=Channel.INBOUND, db_index=True)    
    file_format  = models.CharField(max_length=10, choices=FileFormat.choices)
    file_size    = models.IntegerField(default=0, help_text="File size in bytes")
    duration    = models.IntegerField(default=0, help_text="Duration in seconds")
    status      = models.CharField(max_length=20, choices=Status.choices,default=Status.PENDING, db_index=True)
    tags        = models.JSONField(default=list, blank=True)
    is_flagged   = models.BooleanField(default=False, db_index=True)
    resolution_status = models.CharField(max_length=20, choices=ResolutionStatus.choices,default=ResolutionStatus.UNRESOLVED, db_index=True)
    uploaded_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table            = "call"
        verbose_name        = "Call"
        verbose_name_plural = "Calls"
        ordering            = ["-uploaded_at"]
        indexes = [
            models.Index(fields=["company", "status"]),
            models.Index(fields=["company", "agent"]),
            models.Index(fields=["company", "uploaded_at"]),
            models.Index(fields=["company", "is_flagged"]),
        ]

    def __str__(self):
        return f"Call({self.agent}, {self.status}, {self.uploaded_at:%Y-%m-%d})"