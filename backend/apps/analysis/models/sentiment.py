from django.db import models
from apps.users.models.base import BaseModel
from apps.calls.models import Call


class Sentiment(BaseModel):

    class Label(models.TextChoices):
        POSITIVE = "positive", "Positive"
        NEUTRAL  = "neutral",  "Neutral"
        NEGATIVE = "negative", "Negative"

    call = models.OneToOneField(Call, on_delete=models.CASCADE,related_name="sentiment")
    overall_label = models.CharField(max_length=20, choices=Label.choices,default=Label.NEUTRAL, db_index=True)
    overall_score = models.FloatField(default=0.0)
    segments = models.JSONField(default=list, blank=True,help_text="Per-segment sentiment scores")

    class Meta:
        db_table            = "sentiment"
        verbose_name        = "Sentiment"
        verbose_name_plural = "Sentiments"

    def __str__(self):
        return f"Sentiment({self.call_id}, {self.overall_label}, {self.overall_score})"