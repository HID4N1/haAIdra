import django_filters
from .models import Call


class CallFilter(django_filters.FilterSet):

    # Date range filters
    uploaded_at_from = django_filters.DateTimeFilter(
        field_name="uploaded_at", lookup_expr="gte"
    )
    uploaded_at_to = django_filters.DateTimeFilter(
        field_name="uploaded_at", lookup_expr="lte"
    )

    # Score range filters
    score_min = django_filters.NumberFilter(
        field_name="score__total", lookup_expr="gte"
    )
    score_max = django_filters.NumberFilter(
        field_name="score__total", lookup_expr="lte"
    )

    class Meta:
        model  = Call
        fields = {
            "agent":             ["exact"],
            "status":            ["exact"],
            "language":          ["exact"],
            "channel":           ["exact"],
            "is_flagged":        ["exact"],
            "resolution_status": ["exact"],
            "file_format":       ["exact"],
        }

