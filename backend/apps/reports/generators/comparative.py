from django.db.models import Avg, Count, Q, Min, Max
from apps.calls.models import Call
from apps.analysis.models import Score, Sentiment
from apps.users.models import Agent
from .pdf_base import BasePDFGenerator
from .excel_base import BaseExcelGenerator


def _get_data(company, date_from, date_to, agent_ids=None):
    """
    Shared data fetching.
    agent_ids — list of UUIDs to compare. If None, compares all active agents.
    """
    agent_filter = dict(company=company, status="active")
    if agent_ids:
        agent_filter["id__in"] = agent_ids

    agents = Agent.objects.filter(**agent_filter).select_related("user")

    results = []
    for agent in agents:
        calls = Call.objects.filter(
            company=company,
            agent=agent,
            uploaded_at__date__gte=date_from,
            uploaded_at__date__lte=date_to,
        )

        total    = calls.count()
        analyzed = calls.filter(status="analyzed").count()
        failed   = calls.filter(status="failed").count()
        flagged  = calls.filter(is_flagged=True).count()
        resolved = calls.filter(resolution_status="resolved").count()
        escalated = calls.filter(resolution_status="escalated").count()

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

        sent_breakdown = (
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
        sent = {s["overall_label"]: s["count"] for s in sent_breakdown}

        results.append({
            "agent":          agent,
            "email":          agent.user.email,
            "department":     agent.department or "-",
            "total":          total,
            "analyzed":       analyzed,
            "failed":         failed,
            "flagged":        flagged,
            "resolved":       resolved,
            "escalated":      escalated,
            "resolution_pct": round(resolved / (total or 1) * 100, 1),
            "score_agg":      score_agg,
            "sentiment":      sent,
        })

    # Rank agents by avg score
    results.sort(
        key=lambda x: x["score_agg"]["avg_total"] or 0,
        reverse=True
    )

    return results


def _r(val, n=2):
    try:
        return round(float(val), n) if val is not None else "-"
    except (TypeError, ValueError):
        return "-"


#PDF

class ComparativeReportPDF(BasePDFGenerator):
    TITLE = "Comparative Agent Report"

    def __init__(self, company, date_from, date_to, agent_ids=None):
        super().__init__(company, date_from, date_to)
        self.agent_ids = agent_ids

    def _build_html(self):
        results = _get_data(
            self.company, self.date_from, self.date_to, self.agent_ids
        )

        if not results:
            return f"""
            <!DOCTYPE html><html><head><meta charset="utf-8"></head>
            <body>
                {self._header_html()}
                <p>No agents found for this period.</p>
                {self._footer_html()}
            </body></html>
            """

        # Overview table
        overview_rows = [
            [
                i + 1,
                r["email"],
                r["department"],
                r["total"],
                r["analyzed"],
                r["flagged"],
                r["escalated"],
                f"{r['resolution_pct']}%",
            ]
            for i, r in enumerate(results)
        ]
        overview_table = self._table(
            ["Rank", "Agent", "Dept", "Calls", "Analyzed",
             "Flagged", "Escalated", "Resolution %"],
            overview_rows
        )

        # Score comparison table
        score_rows = [
            [
                r["email"],
                _r(r["score_agg"]["avg_total"]),
                _r(r["score_agg"]["avg_accueil"]),
                _r(r["score_agg"]["avg_empathie"]),
                _r(r["score_agg"]["avg_resolution"]),
                _r(r["score_agg"]["avg_langage"]),
                _r(r["score_agg"]["avg_conformite"]),
                _r(r["score_agg"]["avg_cloture"]),
            ]
            for r in results
        ]
        score_table = self._table(
            ["Agent", "Total", "Accueil", "Empathie", "Resolution",
             "Langage", "Conformité", "Clôture"],
            score_rows
        )

        # Sentiment comparison table
        sent_rows = [
            [
                r["email"],
                r["sentiment"].get("positive", 0),
                r["sentiment"].get("neutral",  0),
                r["sentiment"].get("negative", 0),
                round(
                    r["sentiment"].get("positive", 0) /
                    (sum(r["sentiment"].values()) or 1) * 100, 1
                ),
            ]
            for r in results
        ]
        sent_table = self._table(
            ["Agent", "Positive", "Neutral", "Negative", "Positive %"],
            sent_rows
        )

        return f"""
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body>
            {self._header_html()}
            <div class="section">
                <h2>Agent Overview</h2>
                {overview_table}
            </div>
            <div class="section">
                <h2>Score Comparison</h2>
                {score_table}
            </div>
            <div class="section">
                <h2>Sentiment Comparison</h2>
                {sent_table}
            </div>
            {self._footer_html()}
        </body></html>
        """


#Excel

class ComparativeReportExcel(BaseExcelGenerator):
    TITLE      = "Comparative Agent Report"
    SHEET_NAME = "Comparison"

    def __init__(self, company, date_from, date_to, agent_ids=None):
        super().__init__(company, date_from, date_to)
        self.agent_ids = agent_ids

    def generate(self):
        Workbook, PatternFill, Font, Alignment, Border, Side, get_col = self._imports()
        wb = Workbook()

        results = _get_data(
            self.company, self.date_from, self.date_to, self.agent_ids
        )

        #Sheet 1: Overview
        ws = wb.active
        ws.title = "Overview"

        self._write_title(ws, Font, Alignment)
        self._write_meta(ws, Font, Alignment)

        self._write_section_title(ws, "Agent Overview", Font, Alignment)
        self._write_headers(
            ws, [
                "Rank", "Agent", "Department", "Total Calls",
                "Analyzed", "Failed", "Flagged", "Escalated",
                "Resolution %",
            ],
            PatternFill, Font, Alignment, Border, Side
        )
        for i, r in enumerate(results):
            avg = r["score_agg"]["avg_total"] or 0
            bg  = self.POSITIVE_BG if avg >= 80 else (
                  self.NEGATIVE_BG if avg < 40 else None
            )
            self._write_row(
                ws, [
                    i + 1,
                    r["email"],
                    r["department"],
                    r["total"],
                    r["analyzed"],
                    r["failed"],
                    r["flagged"],
                    r["escalated"],
                    f"{r['resolution_pct']}%",
                ],
                PatternFill, Font, Alignment, Border, Side,
                bg_color=bg,
            )
        self._auto_width(ws)

        #Sheet 2: Score Comparison
        ws2 = wb.create_sheet("Score Comparison")
        self._write_headers(
            ws2, [
                "Agent", "Department", "Avg Total",
                "Accueil", "Empathie", "Resolution",
                "Langage", "Conformité", "Clôture",
                "Min", "Max",
            ],
            PatternFill, Font, Alignment, Border, Side
        )
        for r in results:
            avg = r["score_agg"]["avg_total"] or 0
            bg  = self.POSITIVE_BG if avg >= 80 else (
                  self.NEGATIVE_BG if avg < 40 else None
            )
            self._write_row(
                ws2, [
                    r["email"],
                    r["department"],
                    _r(r["score_agg"]["avg_total"]),
                    _r(r["score_agg"]["avg_accueil"]),
                    _r(r["score_agg"]["avg_empathie"]),
                    _r(r["score_agg"]["avg_resolution"]),
                    _r(r["score_agg"]["avg_langage"]),
                    _r(r["score_agg"]["avg_conformite"]),
                    _r(r["score_agg"]["avg_cloture"]),
                    _r(r["score_agg"]["min_total"]),
                    _r(r["score_agg"]["max_total"]),
                ],
                PatternFill, Font, Alignment, Border, Side,
                bg_color=bg,
            )
        self._auto_width(ws2)

        #Sheet 3: Sentiment Comparison
        ws3 = wb.create_sheet("Sentiment Comparison")
        self._write_headers(
            ws3, [
                "Agent", "Department",
                "Positive", "Neutral", "Negative",
                "Total", "Positive %", "Negative %",
            ],
            PatternFill, Font, Alignment, Border, Side
        )
        for r in results:
            pos   = r["sentiment"].get("positive", 0)
            neu   = r["sentiment"].get("neutral",  0)
            neg   = r["sentiment"].get("negative", 0)
            total = pos + neu + neg or 1
            bg    = self.POSITIVE_BG if pos > neg else (
                    self.NEGATIVE_BG if neg > pos else None
            )
            self._write_row(
                ws3, [
                    r["email"],
                    r["department"],
                    pos, neu, neg, total,
                    f"{round(pos/total*100,1)}%",
                    f"{round(neg/total*100,1)}%",
                ],
                PatternFill, Font, Alignment, Border, Side,
                bg_color=bg,
            )
        self._auto_width(ws3)

        #Sheet 4: Call Volume Comparison
        ws4 = wb.create_sheet("Call Volume")
        self._write_headers(
            ws4, [
                "Agent", "Department", "Total",
                "Analyzed", "Failed", "Flagged",
                "Resolved", "Escalated", "Resolution %",
            ],
            PatternFill, Font, Alignment, Border, Side
        )
        for r in results:
            self._write_row(
                ws4, [
                    r["email"],
                    r["department"],
                    r["total"],
                    r["analyzed"],
                    r["failed"],
                    r["flagged"],
                    r["resolved"],
                    r["escalated"],
                    f"{r['resolution_pct']}%",
                ],
                PatternFill, Font, Alignment, Border, Side
            )
        self._auto_width(ws4)

        return self._to_bytes(wb)