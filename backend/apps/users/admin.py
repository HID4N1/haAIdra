from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Company, Agent, RefreshToken, ScoringConfig


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display    = ("name", "plan", "is_active", "max_calls", "max_users", "created_at")
    list_filter     = ("plan", "is_active")
    search_fields   = ("name",)
    readonly_fields = ("id", "tenant_id", "created_at", "updated_at")


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display    = ("email", "role", "company", "is_active", "two_fa_enabled", "last_login")
    list_filter     = ("role", "is_active", "two_fa_enabled", "company")
    search_fields   = ("email", "phone")
    ordering        = ("email",)
    readonly_fields = ("id", "last_login", "created_at", "updated_at")

    fieldsets = (
        (None,          {"fields": ("email", "password")}),
        ("Profile",     {"fields": ("role", "phone", "avatar", "company")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser",
                                    "two_fa_enabled", "groups", "user_permissions")}),
        ("Timestamps",  {"fields": ("last_login", "created_at", "updated_at")}),
        ("Soft Delete", {"fields": ("is_deleted", "deleted_at")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password1", "password2", "role", "company"),
        }),
    )


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display    = ("user", "company", "department", "status", "total_calls", "avg_score")
    list_filter     = ("status", "company")
    search_fields   = ("user__email", "department")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(RefreshToken)
class RefreshTokenAdmin(admin.ModelAdmin):
    list_display    = ("user", "ip_address", "is_revoked", "expires_at", "created_at")
    list_filter     = ("is_revoked",)
    search_fields   = ("user__email",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(ScoringConfig)
class ScoringConfigAdmin(admin.ModelAdmin):
    list_display = (
        "company", "is_active",
        "accueil_weight", "empathie_weight", "resolution_weight",
        "langage_weight", "conformite_weight", "cloture_weight",
    )
    list_filter  = ("is_active", "company")
    readonly_fields = ("id", "created_at", "updated_at")