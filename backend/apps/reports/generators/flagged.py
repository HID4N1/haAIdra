from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncDate
from apps.calls.models import Call
from apps.analysis.models import Score, Sentiment
from .pdf_base import BasePDFGenerator
from .excel_base import BaseExcelGenerator


def _get_data(company, date_from, date_to, agent_id=None):
    """Shared data fetching for both PDF and Excel."""
    call_filter = dict(
        company=company,
        uploaded_at__date__gte=date_from,
        uploaded_at__date__lte=date_to,
        is_flagged=True,
    )
    if agent_id:
        call_filter["agent_id"] = agent_id

    flagged = Call.objects.filter(**call_filter).select_related(
        "agent__user", "score", "sentiment", "qa_review"
    )

    total         = flagged.count()
    resolved      = flagged.filter(resolution_status="resolved").count()
    unresolved    = flagged.filter(resolution_status="unresolved").count()
    escalated     = flagged.filter(resolution_status="escalated").count()
    reviewed      = flagged.filter(qa_review__isnull=False).count()
    not_reviewed  = total - reviewed

    avg_score = (
        Score.objects
        .filter(
            call__company=company,
            call__uploaded_at__date__gte=date_from,
            call__uploaded_at__date__lte=date_to,
            call__is_flagged=True,
            **({"call__agent_id": agent_id} if agent_id else {}),
        )
        .aggregate(avg=Avg("total"))["avg"]
    )

    # Flagged by agent
    by_agent = (
        flagged
        .values("agent__user__email")
        .annotate(
            count=Count("id"),
            resolved=Count("id", filter=Q(resolution_status="resolved")),
            escalated=Count("id", filter=Q(resolution_status="escalated")),
        )
        .order_by("-count")
    )

    # Flagged trend
    trend = (
        flagged
        .annotate(date=TruncDate("uploaded_at"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )

    # Sentiment breakdown of flagged calls
    sentiment_breakdown = (
        flagged
        .values("sentiment__overall_label")
        .annotate(count=Count("id"))
        .order_by("sentiment__overall_label")
    )

    return {
        "total":                total,
        "resolved":             resolved,
        "unresolved":           unresolved,
        "escalated":            escalated,
        "reviewed":             reviewed,
        "not_reviewed":         not_reviewed,
        "avg_score":            avg_score,
        "by_agent":             list(by_agent),
        "trend":                list(trend),
        "sentiment_breakdown":  list(sentiment_breakdown),
        "calls":                flagged,
    }


def _r(val, n=2):
    try:
        return round(float(val), n) if val is not None else "-"
    except (TypeError, ValueError):
        return "-"


#PDF

class FlaggedCallsReportPDF(BasePDFGenerator):
    TITLE = "Flagged Calls Report"

    def __init__(self, company, date_from, date_to, agent_id=None):
        super().__init__(company, date_from, date_to)
        self.agent_id = agent_id

    def _build_html(self):
        d     = _get_data(self.company, self.date_from, self.date_to, self.agent_id)
        total = d["total"] or 1

        kpis = self._kpi_grid([
            (d["total"],                                       "Total Flagged"),
            (d["resolved"],                                    "Resolved"),
            (d["unresolved"],                                  "Unresolved"),
            (d["escalated"],                                   "Escalated"),
            (d["reviewed"],                                    "Reviewed"),
            (d["not_reviewed"],                                "Not Reviewed"),
            (_r(d["avg_score"]),                              "Avg Score"),
            (f"{round(d['resolved']/total*100,1)}%",         "Resolution Rate"),
        ])

        agent_rows = [
            [
                a["agent__user__email"] or "-",
                a["count"],
                a["resolved"],
                a["escalated"],
                round(a["resolved"] / (a["count"] or 1) * 100, 1),
            ]
            for a in d["by_agent"]
        ]
        agent_table = self._table(
            ["Agent", "Flagged", "Resolved", "Escalated", "Resolution %"],
            agent_rows
        )

        trend_rows  = [[str(t["date"]), t["count"]] for t in d["trend"]]
        trend_table = self._table(["Date", "Count"], trend_rows)

        sent_rows = [
            [
                s["sentiment__overall_label"] or "unknown",
                s["count"],
                round(s["count"] / total * 100, 1),
            ]
            for s in d["sentiment_breakdown"]
        ]
        sent_table = self._table(["Sentiment", "Count", "%"], sent_rows)

        call_rows = []
        for call in d["calls"].order_by("-uploaded_at")[:50]:
            score = getattr(call, "score",     None)
            sent  = getattr(call, "sentiment", None)
            call_rows.append([
                str(call.id)[:8] + "...",
                call.agent.user.email if call.agent else "-",
                call.uploaded_at.strftime("%Y-%m-%d"),
                call.channel,
                _r(score.total)        if score else "-",
                sent.overall_label     if sent  else "-",
                call.resolution_status,
            ])
        call_table = self._table(
            ["Call", "Agent", "Date", "Channel", "Score", "Sentiment", "Resolution"],
            call_rows
        )

        return f"""
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body>
            {self._header_html()}
            <div class="section">
                <h2>Flagged Calls Summary</h2>
                {kpis}
            </div>
            <div class="section">
                <h2>Flagged by Agent</h2>
                {agent_table}
            </div>
            <div class="section">
                <h2>Sentiment of Flagged Calls</h2>
                {sent_table}
            </div>
            <div class="section">
                <h2>Flagged Trend</h2>
                {trend_table}
            </div>
            <div class="section">
                <h2>Flagged Call List (Latest 50)</h2>
                {call_table}
            </div>
            {self._footer_html()}
        </body></html>
        """


#Excel

class FlaggedCallsReportExcel(BaseExcelGenerator):
    TITLE      = "Flagged Calls Report"
    SHEET_NAME = "Flagged Calls"

    def __init__(self, company, date_from, date_to, agent_id=None):
        super().__init__(company, date_from, date_to)
        self.agent_id = agent_id

    def generate(self):
        Workbook, PatternFill, Font, Alignment, Border, Side, get_col = self._imports()
        wb = Workbook()

        d     = _get_data(self.company, self.date_from, self.date_to, self.agent_id)
        total = d["total"] or 1

        #Sheet 1: Summary
        ws = wb.active
        ws.title = "Summary"

        self._write_title(ws, Font, Alignment)
        self._write_meta(ws, Font, Alignment)

        self._write_section_title(ws, "Flagged Calls Summary", Font, Alignment)
        self._write_kpi_section(ws, [
            ("Total Flagged",   d["total"]),
            ("Resolved",        d["resolved"]),
            ("Unresolved",      d["unresolved"]),
            ("Escalated",       d["escalated"]),
            ("Reviewed",        d["reviewed"]),
            ("Not Reviewed",    d["not_reviewed"]),
            ("Avg Score",       _r(d["avg_score"])),
            ("Resolution Rate", f"{round(d['resolved']/total*100,1)}%"),
        ], PatternFill, Font, Alignment, Border, Side)

        # By agent
        self._write_section_title(ws, "Flagged by Agent", Font, Alignment)
        self._write_headers(
            ws, ["Agent", "Flagged", "Resolved", "Escalated", "Resolution %"],
            PatternFill, Font, Alignment, Border, Side
        )
        for a in d["by_agent"]:
            res_pct = round(a["resolved"] / (a["count"] or 1) * 100, 1)
            bg      = self.POSITIVE_BG if res_pct >= 80 else self.NEGATIVE_BG
            self._write_row(
                ws, [
                    a["agent__user__email"] or "-",
                    a["count"],
                    a["resolved"],
                    a["escalated"],
                    f"{res_pct}%",
                ],
                PatternFill, Font, Alignment, Border, Side,
                bg_color=bg,
            )
        ws.append([])

        # Sentiment breakdown
        self._write_section_title(ws, "Sentiment of Flagged Calls", Font, Alignment)
        self._write_headers(
            ws, ["Sentiment", "Count", "%"],
            PatternFill, Font, Alignment, Border, Side
        )
        for s in d["sentiment_breakdown"]:
            label = s["sentiment__overall_label"] or "unknown"
            count = s["count"]
            pct   = round(count / total * 100, 1)
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
            ws2, ["Date", "Flagged Count"],
            PatternFill, Font, Alignment, Border, Side
        )
        for t in d["trend"]:
            self._write_row(
                ws2, [str(t["date"]), t["count"]],
                PatternFill, Font, Alignment, Border, Side
            )
        self._auto_width(ws2)

        #Sheet 3: Full Call List
        ws3 = wb.create_sheet("Flagged Calls")
        self._write_headers(
            ws3, [
                "Call ID", "Agent", "Date", "Channel", "Language",
                "Status", "Score", "Sentiment", "Resolution", "QA Reviewed"
            ],
            PatternFill, Font, Alignment, Border, Side
        )
        for call in d["calls"].select_related(
            "agent__user", "score", "sentiment", "qa_review"
        ).order_by("-uploaded_at"):
            score = getattr(call, "score",     None)
            sent  = getattr(call, "sentiment", None)
            qa    = getattr(call, "qa_review", None)
            bg    = None
            if call.resolution_status == "escalated": bg = self.NEGATIVE_BG
            if call.resolution_status == "resolved":  bg = self.POSITIVE_BG

            self._write_row(
                ws3, [
                    str(call.id),
                    call.agent.user.email if call.agent else "-",
                    call.uploaded_at.strftime("%Y-%m-%d"),
                    call.channel,
                    call.language,
                    call.status,
                    _r(score.total)    if score else "-",
                    sent.overall_label if sent  else "-",
                    call.resolution_status,
                    "Yes" if qa else "No",
                ],
                PatternFill, Font, Alignment, Border, Side,
                bg_color=bg,
            )

        self._auto_width(ws3)
        self._freeze_pane(ws3, "A2")

        return self._to_bytes(wb)