from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncDate
from apps.analysis.models import QAReview
from apps.calls.models import Call
from .pdf_base import BasePDFGenerator
from .excel_base import BaseExcelGenerator


def _get_data(company, date_from, date_to):
    """Shared data fetching for both PDF and Excel."""
    qs = QAReview.objects.filter(
        call__company=company,
        call__uploaded_at__date__gte=date_from,
        call__uploaded_at__date__lte=date_to,
    ).select_related("call__agent__user", "reviewer")

    total     = qs.count()
    approved  = qs.filter(status="approved").count()
    rejected  = qs.filter(status="rejected").count()
    pending   = qs.filter(status="pending").count()
    overridden = qs.filter(is_overridden=True).count()

    avg_override = (
        qs.filter(is_overridden=True)
        .aggregate(avg=Avg("score_override"))["avg"]
    )
    avg_ai_score = (
        qs.filter(is_overridden=True)
        .aggregate(avg=Avg("original_ai_score"))["avg"]
    )

    # Reviewer activity
    reviewer_activity = (
        qs.values("reviewer__email")
        .annotate(
            total=Count("id"),
            approved=Count("id", filter=Q(status="approved")),
            rejected=Count("id", filter=Q(status="rejected")),
            overridden=Count("id", filter=Q(is_overridden=True)),
        )
        .order_by("-total")
    )

    # Review trend
    trend = (
        qs
        .annotate(date=TruncDate("reviewed_at"))
        .values("date", "status")
        .annotate(count=Count("id"))
        .order_by("date", "status")
    )

    # Overridden calls — biggest score differences
    overridden_calls = (
        qs.filter(is_overridden=True)
        .select_related("call__agent__user")
        .order_by("-score_override")[:20]
    )

    # Pending reviews
    pending_reviews = qs.filter(status="pending").order_by("created_at")[:20]

    return {
        "total":             total,
        "approved":          approved,
        "rejected":          rejected,
        "pending":           pending,
        "overridden":        overridden,
        "avg_override":      avg_override,
        "avg_ai_score":      avg_ai_score,
        "reviewer_activity": list(reviewer_activity),
        "trend":             list(trend),
        "overridden_calls":  list(overridden_calls),
        "pending_reviews":   list(pending_reviews),
    }


def _r(val, n=2):
    try:
        return round(float(val), n) if val is not None else "-"
    except (TypeError, ValueError):
        return "-"


#PDF

class QAReviewReportPDF(BasePDFGenerator):
    TITLE = "QA Review Report"

    def _build_html(self):
        d     = _get_data(self.company, self.date_from, self.date_to)
        total = d["total"] or 1

        kpis = self._kpi_grid([
            (d["total"],                                    "Total Reviews"),
            (d["approved"],                                 "Approved"),
            (d["rejected"],                                 "Rejected"),
            (d["pending"],                                  "Pending"),
            (d["overridden"],                               "Overridden"),
            (f"{round(d['approved']/total*100,1)}%",       "Approval Rate"),
            (_r(d["avg_ai_score"]),                        "Avg AI Score"),
            (_r(d["avg_override"]),                        "Avg Override Score"),
        ])

        reviewer_rows = [
            [
                r["reviewer__email"] or "—",
                r["total"],
                r["approved"],
                r["rejected"],
                r["overridden"],
            ]
            for r in d["reviewer_activity"]
        ]
        reviewer_table = self._table(
            ["Reviewer", "Total", "Approved", "Rejected", "Overridden"],
            reviewer_rows
        )

        override_rows = [
            [
                str(r.call_id)[:8] + "...",
                r.call.agent.user.email if r.call.agent else "-",
                _r(r.original_ai_score),
                _r(r.score_override),
                r.override_reason[:50] if r.override_reason else "-",
                r.reviewer.email if r.reviewer else "-",
            ]
            for r in d["overridden_calls"]
        ]
        override_table = self._table(
            ["Call", "Agent", "AI Score", "Override", "Reason", "Reviewer"],
            override_rows
        )

        pending_rows = [
            [
                str(r.call_id)[:8] + "...",
                r.call.agent.user.email if r.call.agent else "-",
                str(r.created_at.strftime("%Y-%m-%d")),
            ]
            for r in d["pending_reviews"]
        ]
        pending_table = self._table(
            ["Call", "Agent", "Created"],
            pending_rows
        )

        return f"""
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body>
            {self._header_html()}
            <div class="section">
                <h2>QA Summary</h2>
                {kpis}
            </div>
            <div class="section">
                <h2>Reviewer Activity</h2>
                {reviewer_table}
            </div>
            <div class="section">
                <h2>Overridden Calls</h2>
                {override_table}
            </div>
            <div class="section">
                <h2>Pending Reviews</h2>
                {pending_table}
            </div>
            {self._footer_html()}
        </body></html>
        """


#Excel

class QAReviewReportExcel(BaseExcelGenerator):
    TITLE      = "QA Review Report"
    SHEET_NAME = "QA Reviews"

    def generate(self):
        Workbook, PatternFill, Font, Alignment, Border, Side, get_col = self._imports()
        wb = Workbook()

        d     = _get_data(self.company, self.date_from, self.date_to)
        total = d["total"] or 1

        #Sheet 1: Summary
        ws = wb.active
        ws.title = "Summary"

        self._write_title(ws, Font, Alignment)
        self._write_meta(ws, Font, Alignment)

        self._write_section_title(ws, "QA Summary", Font, Alignment)
        self._write_kpi_section(ws, [
            ("Total Reviews",   d["total"]),
            ("Approved",        d["approved"]),
            ("Rejected",        d["rejected"]),
            ("Pending",         d["pending"]),
            ("Overridden",      d["overridden"]),
            ("Approval Rate",   f"{round(d['approved']/total*100,1)}%"),
            ("Avg AI Score",    _r(d["avg_ai_score"])),
            ("Avg Override",    _r(d["avg_override"])),
        ], PatternFill, Font, Alignment, Border, Side)

        # Reviewer activity
        self._write_section_title(ws, "Reviewer Activity", Font, Alignment)
        self._write_headers(
            ws, ["Reviewer", "Total", "Approved", "Rejected", "Overridden"],
            PatternFill, Font, Alignment, Border, Side
        )
        for r in d["reviewer_activity"]:
            self._write_row(
                ws, [
                    r["reviewer__email"] or "—",
                    r["total"],
                    r["approved"],
                    r["rejected"],
                    r["overridden"],
                ],
                PatternFill, Font, Alignment, Border, Side
            )

        self._auto_width(ws)

        #Sheet 2: Trend
        ws2 = wb.create_sheet("Trend")
        self._write_headers(
            ws2, ["Date", "Status", "Count"],
            PatternFill, Font, Alignment, Border, Side
        )
        for t in d["trend"]:
            bg = None
            if t["status"] == "approved": bg = self.POSITIVE_BG
            if t["status"] == "rejected": bg = self.NEGATIVE_BG
            self._write_row(
                ws2, [str(t["date"]), t["status"], t["count"]],
                PatternFill, Font, Alignment, Border, Side,
                bg_color=bg,
            )
        self._auto_width(ws2)

        #Sheet 3: Overridden Calls
        ws3 = wb.create_sheet("Overridden")
        self._write_headers(
            ws3, [
                "Call ID", "Agent", "AI Score", "Override Score",
                "Difference", "Reason", "Reviewer", "Reviewed At"
            ],
            PatternFill, Font, Alignment, Border, Side
        )
        for r in d["overridden_calls"]:
            ai    = r.original_ai_score or 0
            ov    = r.score_override    or 0
            diff  = round(ov - ai, 2)
            bg    = self.POSITIVE_BG if diff > 0 else self.NEGATIVE_BG
            self._write_row(
                ws3, [
                    str(r.call_id),
                    r.call.agent.user.email if r.call.agent else "-",
                    _r(ai),
                    _r(ov),
                    diff,
                    r.override_reason or "-",
                    r.reviewer.email if r.reviewer else "-",
                    r.reviewed_at.strftime("%Y-%m-%d") if r.reviewed_at else "-",
                ],
                PatternFill, Font, Alignment, Border, Side,
                bg_color=bg,
            )
        self._auto_width(ws3)

        #Sheet 4: Pending Reviews
        ws4 = wb.create_sheet("Pending")
        self._write_headers(
            ws4, ["Call ID", "Agent", "Created At", "Comment"],
            PatternFill, Font, Alignment, Border, Side
        )
        for r in d["pending_reviews"]:
            self._write_row(
                ws4, [
                    str(r.call_id),
                    r.call.agent.user.email if r.call.agent else "-",
                    r.created_at.strftime("%Y-%m-%d"),
                    r.comment or "-",
                ],
                PatternFill, Font, Alignment, Border, Side
            )
        self._auto_width(ws4)

        return self._to_bytes(wb)