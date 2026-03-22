from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User, Agent, Company, ScoringConfig
from decimal import Decimal

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Company
        fields = [
            "id", "name", "plan", "tenant_id",
            "is_active", "max_calls", "max_users", "storage_quota",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "tenant_id", "created_at", "updated_at"]


class CompanyMinimalSerializer(serializers.ModelSerializer):
    """Lightweight embed used inside user serializers."""
    class Meta:
        model  = Company
        fields = ["id", "name", "plan"]


class UserSerializer(serializers.ModelSerializer):
    """Read-only profile — returned by /me and user list endpoints."""
    company = CompanyMinimalSerializer(read_only=True)

    class Meta:
        model  = User
        fields = [
            "id", "email", "role", "phone", "avatar",
            "is_active", "two_fa_enabled", "last_login",
            "company", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "email", "role", "phone", "avatar",
            "is_active", "two_fa_enabled", "last_login",
            "company", "created_at", "updated_at",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    """
    Create a new user account.
    Role defaults to 'agent'; only admins may pass a different role
    (enforced in the view, not here).
    """
    password  = serializers.CharField(write_only=True, required=True,
                                      validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True,
                                      label="Confirm password")
    company_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model  = User
        fields = ["email", "password", "password2", "role", "phone", "company_id"]
        extra_kwargs = {"role": {"required": False}}

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password2"):
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        company_id = validated_data.pop("company_id", None)
        company    = None

        if company_id:
            try:
                company = Company.objects.get(id=company_id)
            except Company.DoesNotExist:
                raise serializers.ValidationError({"company_id": "Company not found."})

        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            role=validated_data.get("role", User.Role.AGENT),
            phone=validated_data.get("phone", ""),
            company=company,
        )
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Partial profile update — phone, avatar only. No role or company changes."""
    class Meta:
        model  = User
        fields = ["phone", "avatar"]


class UserAdminSerializer(serializers.ModelSerializer):
    """
    Admin-level user management — can set role, company, is_active.
    Used by UserAdminViewSet (admin role only).
    """
    company = CompanyMinimalSerializer(read_only=True)
    company_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model  = User
        fields = [
            "id", "email", "role", "phone", "avatar",
            "is_active", "two_fa_enabled", "last_login",
            "company", "company_id", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "email", "last_login", "created_at", "updated_at"]

    def update(self, instance, validated_data):
        company_id = validated_data.pop("company_id", None)
        if company_id:
            try:
                instance.company = Company.objects.get(id=company_id)
            except Company.DoesNotExist:
                raise serializers.ValidationError({"company_id": "Company not found."})
        return super().update(instance, validated_data)


class AgentSerializer(serializers.ModelSerializer):
    user    = UserSerializer(read_only=True)
    company = CompanyMinimalSerializer(read_only=True)

    class Meta:
        model  = Agent
        fields = [
            "id", "user", "company", "department", "hire_date",
            "status", "total_calls", "avg_score", "coaching_notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "user", "company", "total_calls",
                            "avg_score", "created_at", "updated_at"]


class AgentUpdateSerializer(serializers.ModelSerializer):
    """Manager can update department, hire_date, status, coaching_notes."""
    class Meta:
        model  = Agent
        fields = ["department", "hire_date", "status", "coaching_notes"]


class ScoringConfigSerializer(serializers.ModelSerializer):
    company = CompanyMinimalSerializer(read_only=True)

    class Meta:
        model  = ScoringConfig
        fields = [
            "id", "company",
            "accueil_weight", "empathie_weight", "resolution_weight",
            "langage_weight", "conformite_weight", "cloture_weight",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "company", "created_at", "updated_at"]

    def validate(self, attrs):
        weights = [
            attrs.get("accueil_weight",    getattr(self.instance, "accueil_weight",    0)),
            attrs.get("empathie_weight",   getattr(self.instance, "empathie_weight",   0)),
            attrs.get("resolution_weight", getattr(self.instance, "resolution_weight", 0)),
            attrs.get("langage_weight",    getattr(self.instance, "langage_weight",    0)),
            attrs.get("conformite_weight", getattr(self.instance, "conformite_weight", 0)),
            attrs.get("cloture_weight",    getattr(self.instance, "cloture_weight",    0)),
        ]
        total = sum(weights)
        if abs(total - Decimal("1.0")) > Decimal("0.001"):
            raise serializers.ValidationError(
                f"Weights must sum to 1.0 (got {total})."
            )
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True,
                                         validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True, required=True,
                                          label="Confirm new password")

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password": "Passwords do not match."})
        return attrs

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value