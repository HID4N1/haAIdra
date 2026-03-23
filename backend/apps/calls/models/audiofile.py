from django.db import models
from apps.users.models.base import BaseModel
from .calls import Call


class AudioFile(BaseModel):

    call     = models.OneToOneField(Call, on_delete=models.CASCADE,related_name="audio_file")
    s3_key   = models.CharField(max_length=512, unique=True)
    s3_url   = models.TextField()
    checksum = models.CharField(max_length=64, blank=True, default="")
    file_size = models.IntegerField(default=0)

    class Meta:
        db_table            = "audio_file"
        verbose_name        = "Audio File"
        verbose_name_plural = "Audio Files"

    def __str__(self):
        return f"AudioFile({self.call_id}, {self.s3_key})"