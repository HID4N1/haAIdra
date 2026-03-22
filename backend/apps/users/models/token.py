from django.db import models
from .base import BaseModel
from .user import User

class RefreshToken(BaseModel):

    user       = models.ForeignKey(User, on_delete=models.CASCADE,
                                   related_name="refresh_tokens", db_index=True)
    token      = models.TextField(unique=True, db_index=True)
    expires_at = models.DateTimeField(db_index=True)
    is_revoked = models.BooleanField(default=False, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table            = "refresh_token"
        verbose_name        = "Refresh Token"
        verbose_name_plural = "Refresh Tokens"
        indexes = [
            models.Index(fields=["user", "is_revoked"]),
            models.Index(fields=["user", "expires_at"]),
        ]

    def __str__(self):
        return f"Token({'revoked' if self.is_revoked else 'active'}) — {self.user.email}"

    def revoke(self):
        self.is_revoked = True
        self.save(update_fields=["is_revoked", "updated_at"])