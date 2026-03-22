from django.db import models
from .base import BaseModel
from .company import Company
from decimal import Decimal


class ScoringConfig(BaseModel):
    """
    Per-company scoring rubric.
    Six weights must sum to 1.0 — enforced in the serializer.
    Only one config should be active per company at a time.
    """

    company = models.ForeignKey(Company, on_delete=models.CASCADE,
                                related_name="scoring_configs", db_index=True)
    accueil_weight    = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal("0.20"))
    empathie_weight   = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal("0.20"))
    resolution_weight = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal("0.20"))
    langage_weight    = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal("0.15"))
    conformite_weight = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal("0.15"))
    cloture_weight    = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal("0.10"))
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table            = "scoring_config"
        verbose_name        = "Scoring Config"
        verbose_name_plural = "Scoring Configs"
        indexes = [models.Index(fields=["company", "is_active"])]

    def __str__(self):
        return f"ScoringConfig({self.company.name}, active={self.is_active})"

def total_weight(self):
    return (
        self.accueil_weight + self.empathie_weight + self.resolution_weight
        + self.langage_weight + self.conformite_weight + self.cloture_weight
    )