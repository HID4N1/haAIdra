from django.db.models import Avg, Count, Q, Min, Max
from apps.calls.models import Call
from apps.analysis.models import Score, Sentiment
from apps.users.models import Agent
from .pdf_base import BasePDFGenerator
from .excel_base import BaseExcelGenerator


def _get_data(company, agent_id, date_from, date_to):
    """Shared data fetching for both PDF and Excel."""
    try:
        agent = Agent.objects.select_related("user", "company").get(
            id=agent_id, company=company
        )
    except Agent.DoesNotExist:
        return None

    calls = Call.objects.filter(
        company=company,
        agent=agent,
        uploaded_at__date__gte=date_from,
        uploaded_at__date__lte=date_to,
    ).select_related("score", "sentiment", "summary")

    total    = calls.count()
    analyzed = calls.filter(status="analyzed").count()
    failed   = calls.filter(status="failed").count()
    flagged  = calls.filter(is_flagged=True).count()
    resolved = calls.filter(resolution_status="resolved").count()

    score_agg = Score.objects.filter(
        call__company=company,
        call__agent=agent,
        call__uploaded_at__date__gte=date_from,
        call__uploaded_at__date__lte=date_to,
    ).aggregate(
        avg_total=Avg("total"),
        min_total=Min("total"),
        max_total=Max("total"),
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
            call__agent=agent,
            call__uploaded_at__date__gte=date_from,
            call__uploaded_at__date__lte=date_to,
        )
        .values("overall_label")
        .annotate(count=Count("id"))
    )
    sent_counts = {s["overall_label"]: s["count"] for s in sentiment_breakdown}

    return {
        "agent":     agent,
        "calls":     calls,
        "total":     total,
        "analyzed":  analyzed,
        "failed":    failed,
        "flagged":   flagged,
        "resolved":  resolved,
        "score_agg": score_agg,
        "sentiment": sent_counts,
    }


def _r(val, n=2):
    try:
        return round(float(val), n) if val is not None else "-"
    except (TypeError, ValueError):
        return "-"


#PDF

class AgentMonthlyPDF(BasePDFGenerator):
    TITLE = "Agent Monthly Report"

    def __init__(self, company, date_from, date_to, agent_id):
        super().__init__(company, date_from, date_to)
        self.agent_id = agent_id

    def _build_html(self):
        d = _get_data(self.company, self.agent_id, self.date_from, self.date_to)

        if not d:
            return f"""
            <!DOCTYPE html><html><head><meta charset="utf-8"></head>
            <body>
                {self._header_html()}
                <p>Agent not found.</p>
                {self._footer_html()}
            </body></html>
            """

        agent = d["agent"]
        total = d["total"] or 1

        kpis = self._kpi_grid([
            (d["total"],                              "Total Calls"),
            (d["analyzed"],                           "Analyzed"),
            (_r(d["score_agg"]["avg_total"]),         "Avg Score"),
            (_r(d["score_agg"]["min_total"]),         "Min Score"),
            (_r(d["score_agg"]["max_total"]),         "Max Score"),
            (f"{round(d['resolved']/total*100,1)}%", "Resolution Rate"),
            (d["flagged"],                            "Flagged"),
            (d["sentiment"].get("positive", 0),      "Positive"),
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

        call_rows = []
        for call in d["calls"]:
            score = getattr(call, "score",     None)
            sent  = getattr(call, "sentiment", None)
            call_rows.append([
                str(call.id)[:8] + "...",
                call.uploaded_at.strftime("%Y-%m-%d"),
                call.channel,
                call.language,
                call.status,
                _r(score.total) if score else "-",
                sent.overall_label if sent else "-",
                "Yes" if call.is_flagged else "No",
                call.resolution_status,
            ])
        call_table = self._table(
            ["ID", "Date", "Channel", "Language", "Status",
             "Score", "Sentiment", "Flagged", "Resolution"],
            call_rows
        )

        return f"""
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body>
            {self._header_html(subtitle=f"Agent: {agent.user.email} | Dept: {agent.department or '-'}")}
            <div class="section">
                <h2>KPI Summary</h2>
                {kpis}
            </div>
            <div class="section">
                <h2>Score Breakdown by Criteria</h2>
                {score_table}
            </div>
            <div class="section">
                <h2>Call List</h2>
                {call_table}
            </div>
            {self._footer_html()}
        </body></html>
        """


#Excel

class AgentMonthlyExcel(BaseExcelGenerator):
    TITLE      = "Agent Monthly Report"
    SHEET_NAME = "Agent Report"

    def __init__(self, company, date_from, date_to, agent_id):
        super().__init__(company, date_from, date_to)
        self.agent_id = agent_id

    def generate(self):
        Workbook, PatternFill, Font, Alignment, Border, Side, get_col = self._imports()
        wb = Workbook()
        ws = wb.active
        ws.title = self.SHEET_NAME

        self._write_title(ws, Font, Alignment)
        self._write_meta(ws, Font, Alignment)

        d = _get_data(self.company, self.agent_id, self.date_from, self.date_to)

        if not d:
            ws.append(["Agent not found."])
            return self._to_bytes(wb)

        agent = d["agent"]
        total = d["total"] or 1

        #Agent profile
        self._write_section_title(ws, "Agent Profile", Font, Alignment)
        for label, value in [
            ("Email",      agent.user.email),
            ("Department", agent.department or "-"),
            ("Status",     agent.status),
            ("Hire Date",  str(agent.hire_date) if agent.hire_date else "-"),
            ("Total Calls (all time)", agent.total_calls),
            ("Avg Score (all time)",   _r(agent.avg_score)),
        ]:
            self._write_row(
                ws, [label, value],
                PatternFill, Font, Alignment, Border, Side
            )
        ws.append([])

        #KPI section
        self._write_section_title(ws, "KPI Summary (Period)", Font, Alignment)
        self._write_kpi_section(ws, [
            ("Total Calls",     d["total"]),
            ("Analyzed",        d["analyzed"]),
            ("Failed",          d["failed"]),
            ("Flagged",         d["flagged"]),
            ("Avg Score",       _r(d["score_agg"]["avg_total"])),
            ("Min Score",       _r(d["score_agg"]["min_total"])),
            ("Max Score",       _r(d["score_agg"]["max_total"])),
            ("Resolution Rate", f"{round(d['resolved']/total*100,1)}%"),
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

        #Sentiment breakdown
        self._write_section_title(ws, "Sentiment Distribution", Font, Alignment)
        self._write_headers(
            ws, ["Label", "Count"],
            PatternFill, Font, Alignment, Border, Side
        )
        for label, count in d["sentiment"].items():
            bg = None
            if label == "positive": bg = self.POSITIVE_BG
            if label == "negative": bg = self.NEGATIVE_BG
            self._write_row(
                ws, [label, count],
                PatternFill, Font, Alignment, Border, Side,
                bg_color=bg,
            )
        ws.append([])

        #Call list
        self._write_section_title(ws, "Call List", Font, Alignment)
        self._write_headers(
            ws, [
                "Call ID", "Date", "Channel", "Language",
                "Status", "Score", "Sentiment", "Flagged", "Resolution"
            ],
            PatternFill, Font, Alignment, Border, Side
        )
        for call in d["calls"].select_related("score", "sentiment"):
            score = getattr(call, "score",     None)
            sent  = getattr(call, "sentiment", None)
            bg    = None
            if sent:
                if sent.overall_label == "positive": bg = self.POSITIVE_BG
                if sent.overall_label == "negative": bg = self.NEGATIVE_BG

            self._write_row(
                ws, [
                    str(call.id),
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