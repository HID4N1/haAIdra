from django.db import models
from apps.users.models.base import BaseModel
from apps.calls.models import Call
from apps.users.models import ScoringConfig


class Score(BaseModel):

    class ScoredBy(models.TextChoices):
        AI     = "ai",     "AI"
        MANUAL = "manual", "Manual"
        HYBRID = "hybrid", "Hybrid"

    call = models.OneToOneField(Call, on_delete=models.CASCADE,related_name="score")
    config = models.ForeignKey(ScoringConfig, on_delete=models.PROTECT,related_name="scores", null=True, blank=True,db_index=True)
    accueil = models.FloatField(default=0.0)
    accueil_max = models.FloatField(default=20.0)
    empathie = models.FloatField(default=0.0)
    empathie_max = models.FloatField(default=20.0)
    resolution = models.FloatField(default=0.0)
    resolution_max = models.FloatField(default=20.0)
    langage = models.FloatField(default=0.0)
    langage_max = models.FloatField(default=15.0)
    conformite = models.FloatField(default=0.0)
    conformite_max = models.FloatField(default=15.0)
    cloture  = models.FloatField(default=0.0)
    cloture_max  = models.FloatField(default=10.0)
    total = models.FloatField(default=0.0, db_index=True)
    ai_total = models.FloatField(default=0.0)
    scored_by = models.CharField(max_length=20, choices=ScoredBy.choices,default=ScoredBy.AI, db_index=True)

    class Meta:
        db_table            = "score"
        verbose_name        = "Score"
        verbose_name_plural = "Scores"

    def __str__(self):
        return f"Score({self.call_id}, total={self.total}, by={self.scored_by})"

    def compute_total(self):
        """Sum all criteria scores."""
        self.total = round(
            self.accueil + self.empathie + self.resolution
            + self.langage + self.conformite + self.cloture, 2
        )
        return self.total