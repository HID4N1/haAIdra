import io
from datetime import date, timedelta
from django.utils import timezone


def get_month_range(year, month):
    """Returns (date_from, date_to) for a given month."""
    date_from = date(year, month, 1)
    if month == 12:
        date_to = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        date_to = date(year, month + 1, 1) - timedelta(days=1)
    return date_from, date_to


def get_date_range(request):
    """
    Extracts date range from request query params.
    Supports:
      - ?month=3&year=2026
      - ?from=2026-01-01&to=2026-03-31
    Defaults to current month.
    """
    month = request.query_params.get("month")
    year  = request.query_params.get("year")
    from_ = request.query_params.get("from")
    to_   = request.query_params.get("to")

    if from_ and to_:
        try:
            return date.fromisoformat(from_), date.fromisoformat(to_)
        except ValueError:
            pass

    if month and year:
        try:
            return get_month_range(int(year), int(month))
        except (ValueError, TypeError):
            pass

    today = timezone.now().date()
    return get_month_range(today.year, today.month)


def get_format(request):
    """Returns 'pdf', 'excel', or 'csv' from ?format= param."""
    fmt = request.query_params.get("format", "excel").lower()
    return fmt if fmt in ("pdf", "excel", "csv") else "excel"