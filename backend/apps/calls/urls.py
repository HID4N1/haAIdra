from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CallViewSet

router = DefaultRouter()
router.register(r"calls", CallViewSet, basename="call")

urlpatterns = [
    path("", include(router.urls)),
]



# GET    api/v1/calls/
# POST   api/v1/calls/
# GET    api/v1/calls/{id}/
# PATCH  api/v1/calls/{id}/
# DELETE api/v1/calls/{id}/
# GET    api/v1/calls/{id}/status/
# POST   api/v1/calls/{id}/flag/