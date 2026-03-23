from django.db.models import Avg, Count, Q
from apps.calls.models import Call
from apps.analysis.models import Score, Sentiment
from apps.users.models import Agent
from .pdf_base import BasePDFGenerator
from .excel_base import BaseExcelGenerator


def _get_data(company, date_from, date_to):
    """Shared data fetching for both PDF and Excel."""
    calls = Call.objects.filter(
        company=company,
        uploaded_at__date__gte=date_from,
        uploaded_at__date__lte=date_to,
    ).select_related("agent__user", "score", "sentiment")

    total    = calls.count()
    analyzed = calls.filter(status="analyzed").count()
    failed   = calls.filter(status="failed").count()
    flagged  = calls.filter(is_flagged=True).count()
    resolved = calls.filter(resolution_status="resolved").count()

    score_agg = Score.objects.filter(
        call__company=company,
        call__uploaded_at__date__gte=date_from,
        call__uploaded_at__date__lte=date_to,
    ).aggregate(
        avg_total=Avg("total"),
        avg_accueil=Avg("accueil"),
        avg_empathie=Avg("empathie"),
        avg_resolution=Avg("resolution"),
        avg_langage=Avg("langage"),
        avg_conformite=Avg("conformite"),
        avg_cloture=Avg("cloture"),
    )

    sentiment_breakdown = (
        Sentiment.objects
        .filter(
            call__company=company,
            call__uploaded_at__date__gte=date_from,
            call__uploaded_at__date__lte=date_to,
        )
        .values("overall_label")
        .annotate(count=Count("id"))
    )
    sent_counts = {s["overall_label"]: s["count"] for s in sentiment_breakdown}

    agents = (
        Agent.objects
        .filter(company=company, status="active")
        .select_related("user")
        .annotate(
            period_calls=Count(
                "calls",
                filter=Q(
                    calls__uploaded_at__date__gte=date_from,
                    calls__uploaded_at__date__lte=date_to,
                )
            ),
            period_avg_score=Avg(
                "calls__score__total",
                filter=Q(
                    calls__uploaded_at__date__gte=date_from,
                    calls__uploaded_at__date__lte=date_to,
                )
            ),
        )
        .order_by("-period_avg_score")[:10]
    )

    return {
        "total":     total,
        "analyzed":  analyzed,
        "failed":    failed,
        "flagged":   flagged,
        "resolved":  resolved,
        "score_agg": score_agg,
        "sentiment": sent_counts,
        "agents":    list(agents),
        "calls":     calls,
    }


def _r(val, n=2):
    """Safe round."""
    try:
        return round(float(val), n) if val is not None else "-"
    except (TypeError, ValueError):
        return "-"


#PDF

class CompanyMonthlyPDF(BasePDFGenerator):
    TITLE = "Company Monthly Report"

    def _build_html(self):
        d = _get_data(self.company, self.date_from, self.date_to)

        total = d["total"] or 1
        kpis  = self._kpi_grid([
            (d["total"],                       "Total Calls"),
            (d["analyzed"],                    "Analyzed"),
            (f"{_r(d['score_agg']['avg_total'])}", "Avg Score"),
            (f"{round(d['resolved'] / total * 100, 1)}%", "Resolution Rate"),
            (d["flagged"],                     "Flagged"),
            (d["failed"],                      "Failed"),
            (d["sentiment"].get("positive", 0), "Positive"),
            (d["sentiment"].get("negative", 0), "Negative"),
        ])

        score_rows = [
            ["Accueil",    _r(d["score_agg"]["avg_accueil"])],
            ["Empathie",   _r(d["score_agg"]["avg_empathie"])],
            ["Resolution", _r(d["score_agg"]["avg_resolution"])],
            ["Langage",    _r(d["score_agg"]["avg_langage"])],
            ["Conformité", _r(d["score_agg"]["avg_conformite"])],
            ["Clôture",    _r(d["score_agg"]["avg_cloture"])],
        ]
        score_table = self._table(["Criteria", "Avg Score"], score_rows)

        agent_rows = [
            [
                a.user.email,
                a.department or "-",
                a.period_calls,
                _r(a.period_avg_score),
            ]
            for a in d["agents"]
        ]
        agent_table = self._table(
            ["Agent", "Department", "Calls", "Avg Score"], agent_rows
        )

        return f"""
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body>
            {self._header_html()}
            <div class="section">
                <h2>KPI Summary</h2>
                {kpis}
            </div>
            <div class="section">
                <h2>Score Breakdown by Criteria</h2>
                {score_table}
            </div>
            <div class="section">
                <h2>Agent Leaderboard (Top 10)</h2>
                {agent_table}
            </div>
            {self._footer_html()}
        </body></html>
        """


#Excel

class CompanyMonthlyExcel(BaseExcelGenerator):
    TITLE      = "Company Monthly Report"
    SHEET_NAME = "Company Report"

    def generate(self):
        Workbook, PatternFill, Font, Alignment, Border, Side, get_col = self._imports()
        wb = Workbook()
        ws = wb.active
        ws.title = self.SHEET_NAME

        self._write_title(ws, Font, Alignment)
        self._write_meta(ws, Font, Alignment)

        d     = _get_data(self.company, self.date_from, self.date_to)
        total = d["total"] or 1

        #KPI section
        self._write_section_title(ws, "KPI Summary", Font, Alignment)
        self._write_kpi_section(ws, [
            ("Total Calls",     d["total"]),
            ("Analyzed",        d["analyzed"]),
            ("Failed",          d["failed"]),
            ("Flagged",         d["flagged"]),
            ("Avg Score",       _r(d["score_agg"]["avg_total"])),
            ("Resolution Rate", f"{round(d['resolved'] / total * 100, 1)}%"),
            ("Positive",        d["sentiment"].get("positive", 0)),
            ("Negative",        d["sentiment"].get("negative", 0)),
        ], PatternFill, Font, Alignment, Border, Side)

        #Score breakdown
        self._write_section_title(ws, "Score Breakdown by Criteria", Font, Alignment)
        self._write_headers(
            ws, ["Criteria", "Avg Score"],
            PatternFill, Font, Alignment, Border, Side
        )
        for criteria, key in [
            ("Accueil",    "avg_accueil"),
            ("Empathie",   "avg_empathie"),
            ("Resolution", "avg_resolution"),
            ("Langage",    "avg_langage"),
            ("Conformité", "avg_conformite"),
            ("Clôture",    "avg_cloture"),
        ]:
            self._write_row(
                ws, [criteria, _r(d["score_agg"][key])],
                PatternFill, Font, Alignment, Border, Side
            )
        ws.append([])

        #Agent leaderboard
        self._write_section_title(ws, "Agent Leaderboard (Top 10)", Font, Alignment)
        self._write_headers(
            ws, ["Agent", "Department", "Calls in Period", "Avg Score"],
            PatternFill, Font, Alignment, Border, Side
        )
        for agent in d["agents"]:
            self._write_row(
                ws, [
                    agent.user.email,
                    agent.department or "-",
                    agent.period_calls,
                    _r(agent.period_avg_score),
                ],
                PatternFill, Font, Alignment, Border, Side
            )
        ws.append([])

        #Call list
        self._write_section_title(ws, "Call List", Font, Alignment)
        self._write_headers(
            ws, [
                "Call ID", "Agent", "Date", "Channel", "Language",
                "Status", "Score", "Sentiment", "Flagged", "Resolution"
            ],
            PatternFill, Font, Alignment, Border, Side
        )
        for call in d["calls"].select_related(
            "agent__user", "score", "sentiment"
        ):
            score = getattr(call, "score",     None)
            sent  = getattr(call, "sentiment", None)
            bg    = None
            if sent:
                if sent.overall_label == "positive": bg = self.POSITIVE_BG
                if sent.overall_label == "negative": bg = self.NEGATIVE_BG

            self._write_row(
                ws, [
                    str(call.id),
                    call.agent.user.email if call.agent else "-",
                    call.uploaded_at.strftime("%Y-%m-%d"),
                    call.channel,
                    call.language,
                    call.status,
                    _r(score.total) if score else "-",
                    sent.overall_label if sent else "-",
                    "Yes" if call.is_flagged else "No",
                    call.resolution_status,
                ],
                PatternFill, Font, Alignment, Border, Side,
                bg_color=bg,
            )

        self._auto_width(ws)
        self._freeze_pane(ws, "A5")
        return self._to_bytes(wb)