from django.db import models
from apps.users.models.base import BaseModel
from apps.calls.models import Call
from apps.users.models import User


class QAReview(BaseModel):

    class Status(models.TextChoices):
        PENDING  = "pending",  "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    call = models.OneToOneField(Call, on_delete=models.CASCADE,related_name="qa_review")
    reviewer = models.ForeignKey(User, on_delete=models.PROTECT,related_name="qa_reviews",null=True, blank=True, db_index=True)
    score_override = models.FloatField(null=True, blank=True)
    original_ai_score = models.FloatField(null=True, blank=True)
    is_overridden = models.BooleanField(default=False)
    override_reason = models.TextField(blank=True, default="")
    comment = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=Status.choices,default=Status.PENDING, db_index=True)
    reviewed_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        db_table            = "qa_review"
        verbose_name        = "QA Review"
        verbose_name_plural = "QA Reviews"
        indexes = [
            models.Index(fields=["status", "reviewed_at"]),
        ]

    def __str__(self):
        return f"QAReview({self.call_id}, {self.status})"