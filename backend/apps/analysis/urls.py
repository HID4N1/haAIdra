from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import AnalysisView, TriggerAnalysisView, QAReviewViewSet

router = DefaultRouter()
router.register(r"reviews", QAReviewViewSet, basename="qa-review")

urlpatterns = [
    path("calls/<uuid:call_id>/analysis/", AnalysisView.as_view(),        name="call-analysis"),
    path("calls/<uuid:call_id>/analyze/",  TriggerAnalysisView.as_view(), name="call-trigger-analysis"),
] + router.urls

# GET  api/v1/calls/{id}/analysis/   — get full analysis / poll status
# POST api/v1/calls/{id}/analyze/    — re-trigger pipeline
# GET  api/v1/reviews/               — list QA reviews
# GET  api/v1/reviews/{id}/          — review detail
# PATCH api/v1/reviews/{id}/         — override score