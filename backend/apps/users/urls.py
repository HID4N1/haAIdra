from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, LoginView, TokenRefreshView,
    LogoutView, MeView, ChangePasswordView,
    UserViewSet, UserAdminViewSet,
    AgentViewSet, CompanyViewSet,
)

router = DefaultRouter()
router.register(r"users",       UserViewSet,      basename="user")
router.register(r"agents",      AgentViewSet,     basename="agent")
router.register(r"companies",   CompanyViewSet,   basename="company")
router.register(r"admin/users", UserAdminViewSet, basename="admin-user")

auth_urlpatterns = [
    path("register/",    RegisterView.as_view(),      name="auth-register"),
    path("login/",       LoginView.as_view(),          name="auth-login"),
    path("refresh/",     TokenRefreshView.as_view(),   name="auth-refresh"),
    path("logout/",      LogoutView.as_view(),          name="auth-logout"),
    path("me/",          MeView.as_view(),              name="auth-me"),
    path("me/password/", ChangePasswordView.as_view(), name="auth-change-password"),
]

urlpatterns = [
    path("auth/", include(auth_urlpatterns)),
    path("", include(router.urls)),
]

# POST   api/v1/auth/register/
# POST   api/v1/auth/login/
# POST   api/v1/auth/refresh/
# POST   api/v1/auth/logout/
# GET    api/v1/auth/me/
# PATCH  api/v1/auth/me/
# POST   api/v1/auth/me/password/
# GET    api/v1/users/
# GET    api/v1/agents/
# GET    api/v1/companies/
# GET    api/v1/admin/users/