from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from .base import BaseModel, SoftDeleteQuerySet
from .company import Company


class UserManager(BaseUserManager):

    def _create_user(self, email, password, **extra):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user  = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("role", "admin")
        return self._create_user(email, password, **extra)

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)


class User(AbstractBaseUser, PermissionsMixin, BaseModel):

    class Role(models.TextChoices):
        ADMIN         = "admin",         "Admin"
        MANAGER       = "manager",       "Manager"
        QA_SUPERVISOR = "qa_supervisor", "QA Supervisor"
        AGENT         = "agent",         "Agent"

    email          = models.EmailField(unique=True, db_index=True)
    role           = models.CharField(max_length=20, choices=Role.choices, default=Role.AGENT, db_index=True)
    phone          = models.CharField(max_length=30, blank=True, default="")
    avatar         = models.CharField(max_length=512, blank=True, default="")
    is_active      = models.BooleanField(default=True, db_index=True)
    is_staff       = models.BooleanField(default=False)
    two_fa_enabled = models.BooleanField(default=False)
    company        = models.ForeignKey(
        Company, on_delete=models.PROTECT,
        related_name="users", null=True, blank=True, db_index=True,
    )

    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = []
    objects         = UserManager()

    class Meta:
        db_table            = "user"
        verbose_name        = "User"
        verbose_name_plural = "Users"
        indexes = [
            models.Index(fields=["company", "role"]),
            models.Index(fields=["company", "is_active"]),
        ]

    def __str__(self):
        return f"{self.email} [{self.role}]"

    @property
    def is_admin(self):        return self.role == self.Role.ADMIN
    @property
    def is_manager(self):      return self.role == self.Role.MANAGER
    @property
    def is_qa_supervisor(self): return self.role == self.Role.QA_SUPERVISOR
    @property
    def is_agent(self):        return self.role == self.Role.AGENT

