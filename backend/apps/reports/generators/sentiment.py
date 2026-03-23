from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncDate
from apps.calls.models import Call
from apps.analysis.models import Sentiment
from apps.users.models import Agent
from .pdf_base import BasePDFGenerator
from .excel_base import BaseExcelGenerator


def _get_data(company, date_from, date_to, agent_id=None):
    """Shared data fetching for both PDF and Excel."""
    filters = dict(
        call__company=company,
        call__uploaded_at__date__gte=date_from,
        call__uploaded_at__date__lte=date_to,
    )
    if agent_id:
        filters["call__agent_id"] = agent_id

    qs = Sentiment.objects.filter(**filters).select_related(
        "call__agent__user"
    )

    # Overall breakdown
    breakdown  = qs.values("overall_label").annotate(count=Count("id"))
    sent_counts = {s["overall_label"]: s["count"] for s in breakdown}
    total       = sum(sent_counts.values()) or 1

    # Trend over time
    trend = (
        qs
        .annotate(date=TruncDate("call__uploaded_at"))
        .values("date", "overall_label")
        .annotate(count=Count("id"))
        .order_by("date", "overall_label")
    )

    # Per-agent sentiment
    agent_sentiment = (
        Sentiment.objects
        .filter(**filters)
        .values("call__agent__user__email", "overall_label")
        .annotate(count=Count("id"))
        .order_by("call__agent__user__email", "overall_label")
    )

    # Most negative calls
    negative_calls = (
        Call.objects
        .filter(
            company=company,
            uploaded_at__date__gte=date_from,
            uploaded_at__date__lte=date_to,
            sentiment__overall_label="negative",
            **({"agent_id": agent_id} if agent_id else {}),
        )
        .select_related("agent__user", "sentiment", "score")
        .order_by("sentiment__overall_score")[:10]
    )

    # Avg sentiment score over time
    avg_trend = (
        qs
        .annotate(date=TruncDate("call__uploaded_at"))
        .values("date")
        .annotate(avg_score=Avg("overall_score"))
        .order_by("date")
    )

    return {
        "total":           total,
        "sent_counts":     sent_counts,
        "positive_pct":    round(sent_counts.get("positive", 0) / total * 100, 1),
        "neutral_pct":     round(sent_counts.get("neutral",  0) / total * 100, 1),
        "negative_pct":    round(sent_counts.get("negative", 0) / total * 100, 1),
        "trend":           list(trend),
        "agent_sentiment": list(agent_sentiment),
        "negative_calls":  list(negative_calls),
        "avg_trend":       list(avg_trend),
    }


def _r(val, n=2):
    try:
        return round(float(val), n) if val is not None else "-"
    except (TypeError, ValueError):
        return "-"


#PDF

class SentimentReportPDF(BasePDFGenerator):
    TITLE = "Sentiment Analysis Report"

    def __init__(self, company, date_from, date_to, agent_id=None):
        super().__init__(company, date_from, date_to)
        self.agent_id = agent_id

    def _build_html(self):
        d = _get_data(self.company, self.date_from, self.date_to, self.agent_id)

        kpis = self._kpi_grid([
            (d["total"],                              "Total Analyzed"),
            (d["sent_counts"].get("positive", 0),    "Positive"),
            (d["sent_counts"].get("neutral",  0),    "Neutral"),
            (d["sent_counts"].get("negative", 0),    "Negative"),
            (f"{d['positive_pct']}%",                "Positive %"),
            (f"{d['neutral_pct']}%",                 "Neutral %"),
            (f"{d['negative_pct']}%",                "Negative %"),
            (len(d["negative_calls"]),               "Critical Calls"),
        ])

        trend_rows = [
            [str(t["date"]), t["overall_label"], t["count"]]
            for t in d["trend"]
        ]
        trend_table = self._table(["Date", "Label", "Count"], trend_rows)

        agent_rows = [
            [
                a["call__agent__user__email"] or "-",
                a["overall_label"],
                a["count"],
            ]
            for a in d["agent_sentiment"]
        ]
        agent_table = self._table(["Agent", "Sentiment", "Count"], agent_rows)

        neg_rows = []
        for call in d["negative_calls"]:
            sent  = getattr(call, "sentiment", None)
            score = getattr(call, "score",     None)
            neg_rows.append([
                str(call.id)[:8] + "...",
                call.agent.user.email if call.agent else "-",
                call.uploaded_at.strftime("%Y-%m-%d"),
                _r(sent.overall_score) if sent else "-",
                _r(score.total)        if score else "-",
                call.resolution_status,
            ])
        neg_table = self._table(
            ["Call ID", "Agent", "Date", "Sentiment Score", "Quality Score", "Resolution"],
            neg_rows
        )

        return f"""
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body>
            {self._header_html()}
            <div class="section">
                <h2>Sentiment Summary</h2>
                {kpis}
            </div>
            <div class="section">
                <h2>Sentiment Trend</h2>
                {trend_table}
            </div>
            <div class="section">
                <h2>Per-Agent Sentiment</h2>
                {agent_table}
            </div>
            <div class="section">
                <h2>Most Negative Calls</h2>
                {neg_table}
            </div>
            {self._footer_html()}
        </body></html>
        """


#Excel

class SentimentReportExcel(BaseExcelGenerator):
    TITLE      = "Sentiment Analysis Report"
    SHEET_NAME = "Sentiment"

    def __init__(self, company, date_from, date_to, agent_id=None):
        super().__init__(company, date_from, date_to)
        self.agent_id = agent_id

    def generate(self):
        Workbook, PatternFill, Font, Alignment, Border, Side, get_col = self._imports()
        wb = Workbook()

        d = _get_data(self.company, self.date_from, self.date_to, self.agent_id)

        #Sheet 1: Summary
        ws = wb.active
        ws.title = "Summary"

        self._write_title(ws, Font, Alignment)
        self._write_meta(ws, Font, Alignment)

        self._write_section_title(ws, "Sentiment Summary", Font, Alignment)
        self._write_kpi_section(ws, [
            ("Total Analyzed",  d["total"]),
            ("Positive",        d["sent_counts"].get("positive", 0)),
            ("Neutral",         d["sent_counts"].get("neutral",  0)),
            ("Negative",        d["sent_counts"].get("negative", 0)),
            ("Positive %",      f"{d['positive_pct']}%"),
            ("Neutral %",       f"{d['neutral_pct']}%"),
            ("Negative %",      f"{d['negative_pct']}%"),
        ], PatternFill, Font, Alignment, Border, Side)

        # Breakdown table
        self._write_section_title(ws, "Breakdown", Font, Alignment)
        self._write_headers(
            ws, ["Label", "Count", "Percentage"],
            PatternFill, Font, Alignment, Border, Side
        )
        for label in ("positive", "neutral", "negative"):
            count = d["sent_counts"].get(label, 0)
            pct   = round(count / (d["total"] or 1) * 100, 1)
            bg    = None
            if label == "positive": bg = self.POSITIVE_BG
            if label == "negative": bg = self.NEGATIVE_BG
            self._write_row(
                ws, [label, count, f"{pct}%"],
                PatternFill, Font, Alignment, Border, Side,
                bg_color=bg,
            )

        self._auto_width(ws)

        #Sheet 2: Trend
        ws2 = wb.create_sheet("Trend")
        self._write_headers(
            ws2, ["Date", "Label", "Count"],
            PatternFill, Font, Alignment, Border, Side
        )
        for t in d["trend"]:
            bg = None
            if t["overall_label"] == "positive": bg = self.POSITIVE_BG
            if t["overall_label"] == "negative": bg = self.NEGATIVE_BG
            self._write_row(
                ws2, [str(t["date"]), t["overall_label"], t["count"]],
                PatternFill, Font, Alignment, Border, Side,
                bg_color=bg,
            )
        self._auto_width(ws2)

        #Sheet 3: Avg Score Trend
        ws3 = wb.create_sheet("Score Trend")
        self._write_headers(
            ws3, ["Date", "Avg Sentiment Score"],
            PatternFill, Font, Alignment, Border, Side
        )
        for t in d["avg_trend"]:
            self._write_row(
                ws3, [str(t["date"]), _r(t["avg_score"])],
                PatternFill, Font, Alignment, Border, Side
            )
        self._auto_width(ws3)

        #Sheet 4: Per-Agent
        ws4 = wb.create_sheet("Per Agent")
        self._write_headers(
            ws4, ["Agent", "Sentiment", "Count"],
            PatternFill, Font, Alignment, Border, Side
        )
        for a in d["agent_sentiment"]:
            bg = None
            if a["overall_label"] == "positive": bg = self.POSITIVE_BG
            if a["overall_label"] == "negative": bg = self.NEGATIVE_BG
            self._write_row(
                ws4, [
                    a["call__agent__user__email"] or "-",
                    a["overall_label"],
                    a["count"],
                ],
                PatternFill, Font, Alignment, Border, Side,
                bg_color=bg,
            )
        self._auto_width(ws4)

        #Sheet 5: Most Negative Calls
        ws5 = wb.create_sheet("Negative Calls")
        self._write_headers(
            ws5, ["Call ID", "Agent", "Date", "Sentiment Score",
                  "Quality Score", "Resolution"],
            PatternFill, Font, Alignment, Border, Side
        )
        for call in d["negative_calls"]:
            sent  = getattr(call, "sentiment", None)
            score = getattr(call, "score",     None)
            self._write_row(
                ws5, [
                    str(call.id),
                    call.agent.user.email if call.agent else "-",
                    call.uploaded_at.strftime("%Y-%m-%d"),
                    _r(sent.overall_score) if sent else "-",
                    _r(score.total)        if score else "-",
                    call.resolution_status,
                ],
                PatternFill, Font, Alignment, Border, Side,
                bg_color=self.NEGATIVE_BG,
            )
        self._auto_width(ws5)

        return self._to_bytes(wb)