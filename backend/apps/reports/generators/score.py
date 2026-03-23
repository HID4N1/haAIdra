"""
apps/reports/generators/score.py

Score performance report — PDF + Excel.
Covers: score KPIs, criteria breakdown, score distribution,
        top/bottom agents by score, score trend over time.
"""

from django.db.models import Avg, Count, Q, Min, Max, F
from django.db.models.functions import TruncDate, TruncWeek
from apps.calls.models import Call
from apps.analysis.models import Score
from apps.users.models import Agent
from .pdf_base import BasePDFGenerator
from .excel_base import BaseExcelGenerator


def _get_data(company, date_from, date_to, agent_id=None):
    """Shared data fetching for both PDF and Excel."""
    score_filter = dict(
        call__company=company,
        call__uploaded_at__date__gte=date_from,
        call__uploaded_at__date__lte=date_to,
    )
    if agent_id:
        score_filter["call__agent_id"] = agent_id

    scores = Score.objects.filter(**score_filter)

    # Overall aggregation
    agg = scores.aggregate(
        total_scored=Count("id"),
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

    # Score distribution
    score_vals = scores.values_list("total", flat=True)
    buckets    = {"0-20": 0, "20-40": 0, "40-60": 0, "60-80": 0, "80-100": 0}
    for s in score_vals:
        if s < 20:    buckets["0-20"]   += 1
        elif s < 40:  buckets["20-40"]  += 1
        elif s < 60:  buckets["40-60"]  += 1
        elif s < 80:  buckets["60-80"]  += 1
        else:         buckets["80-100"] += 1

    # Daily score trend
    daily_trend = (
        scores
        .annotate(date=TruncDate("call__uploaded_at"))
        .values("date")
        .annotate(avg_score=Avg("total"), count=Count("id"))
        .order_by("date")
    )

    # Weekly score trend
    weekly_trend = (
        scores
        .annotate(week=TruncWeek("call__uploaded_at"))
        .values("week")
        .annotate(avg_score=Avg("total"), count=Count("id"))
        .order_by("week")
    )

    # Per-criteria trend
    criteria_trend = (
        scores
        .annotate(date=TruncDate("call__uploaded_at"))
        .values("date")
        .annotate(
            avg_accueil=Avg("accueil"),
            avg_empathie=Avg("empathie"),
            avg_resolution=Avg("resolution"),
            avg_langage=Avg("langage"),
            avg_conformite=Avg("conformite"),
            avg_cloture=Avg("cloture"),
        )
        .order_by("date")
    )

    # Agent leaderboard by score
    agent_scores = (
        Agent.objects
        .filter(company=company, status="active")
        .select_related("user")
        .annotate(
            period_calls=Count(
                "calls__score",
                filter=Q(
                    calls__uploaded_at__date__gte=date_from,
                    calls__uploaded_at__date__lte=date_to,
                )
            ),
            period_avg=Avg(
                "calls__score__total",
                filter=Q(
                    calls__uploaded_at__date__gte=date_from,
                    calls__uploaded_at__date__lte=date_to,
                )
            ),
            period_min=Min(
                "calls__score__total",
                filter=Q(
                    calls__uploaded_at__date__gte=date_from,
                    calls__uploaded_at__date__lte=date_to,
                )
            ),
            period_max=Max(
                "calls__score__total",
                filter=Q(
                    calls__uploaded_at__date__gte=date_from,
                    calls__uploaded_at__date__lte=date_to,
                )
            ),
        )
        .order_by(F("period_avg").desc(nulls_last=True))
    )

    # Scored by breakdown (ai / manual / hybrid)
    scored_by = (
        scores
        .values("scored_by")
        .annotate(count=Count("id"), avg=Avg("total"))
        .order_by("scored_by")
    )

    return {
        "agg":           agg,
        "buckets":       buckets,
        "daily_trend":   list(daily_trend),
        "weekly_trend":  list(weekly_trend),
        "criteria_trend": list(criteria_trend),
        "agent_scores":  list(agent_scores),
        "scored_by":     list(scored_by),
    }


def _r(val, n=2):
    try:
        return round(float(val), n) if val is not None else "-"
    except (TypeError, ValueError):
        return "-"


#PDF

class ScoreReportPDF(BasePDFGenerator):
    TITLE = "Score Performance Report"

    def __init__(self, company, date_from, date_to, agent_id=None):
        super().__init__(company, date_from, date_to)
        self.agent_id = agent_id

    def _build_html(self):
        d = _get_data(self.company, self.date_from, self.date_to, self.agent_id)

        kpis = self._kpi_grid([
            (d["agg"]["total_scored"],          "Scored Calls"),
            (_r(d["agg"]["avg_total"]),         "Avg Score"),
            (_r(d["agg"]["min_total"]),         "Min Score"),
            (_r(d["agg"]["max_total"]),         "Max Score"),
        ])

        criteria_rows = [
            ["Accueil",    _r(d["agg"]["avg_accueil"])],
            ["Empathie",   _r(d["agg"]["avg_empathie"])],
            ["Resolution", _r(d["agg"]["avg_resolution"])],
            ["Langage",    _r(d["agg"]["avg_langage"])],
            ["Conformité", _r(d["agg"]["avg_conformite"])],
            ["Clôture",    _r(d["agg"]["avg_cloture"])],
        ]
        criteria_table = self._table(["Criteria", "Avg Score"], criteria_rows)

        bucket_rows    = [[k, v] for k, v in d["buckets"].items()]
        bucket_table   = self._table(["Score Range", "Count"], bucket_rows)

        trend_rows     = [
            [str(t["date"]), _r(t["avg_score"]), t["count"]]
            for t in d["daily_trend"]
        ]
        trend_table = self._table(["Date", "Avg Score", "Count"], trend_rows)

        agent_rows = [
            [
                a.user.email,
                a.department or "-",
                a.period_calls,
                _r(a.period_avg),
                _r(a.period_min),
                _r(a.period_max),
            ]
            for a in d["agent_scores"]
        ]
        agent_table = self._table(
            ["Agent", "Dept", "Calls", "Avg", "Min", "Max"],
            agent_rows
        )

        scored_by_rows = [
            [s["scored_by"], s["count"], _r(s["avg"])]
            for s in d["scored_by"]
        ]
        scored_by_table = self._table(["Scored By", "Count", "Avg"], scored_by_rows)

        return f"""
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body>
            {self._header_html()}
            <div class="section">
                <h2>Score KPIs</h2>
                {kpis}
            </div>
            <div class="section">
                <h2>Criteria Breakdown</h2>
                {criteria_table}
            </div>
            <div class="section">
                <h2>Score Distribution</h2>
                {bucket_table}
            </div>
            <div class="section">
                <h2>Daily Score Trend</h2>
                {trend_table}
            </div>
            <div class="section">
                <h2>Agent Leaderboard</h2>
                {agent_table}
            </div>
            <div class="section">
                <h2>Scored By Breakdown</h2>
                {scored_by_table}
            </div>
            {self._footer_html()}
        </body></html>
        """


#Excel

class ScoreReportExcel(BaseExcelGenerator):
    TITLE      = "Score Performance Report"
    SHEET_NAME = "Score Report"

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

        self._write_section_title(ws, "Score KPIs", Font, Alignment)
        self._write_kpi_section(ws, [
            ("Scored Calls", d["agg"]["total_scored"]),
            ("Avg Score",    _r(d["agg"]["avg_total"])),
            ("Min Score",    _r(d["agg"]["min_total"])),
            ("Max Score",    _r(d["agg"]["max_total"])),
        ], PatternFill, Font, Alignment, Border, Side)

        self._write_section_title(ws, "Criteria Breakdown", Font, Alignment)
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
                ws, [criteria, _r(d["agg"][key])],
                PatternFill, Font, Alignment, Border, Side
            )
        ws.append([])

        self._write_section_title(ws, "Score Distribution", Font, Alignment)
        self._write_headers(
            ws, ["Range", "Count"],
            PatternFill, Font, Alignment, Border, Side
        )
        for bucket, count in d["buckets"].items():
            bg = None
            if bucket == "80-100": bg = self.POSITIVE_BG
            if bucket == "0-20":   bg = self.NEGATIVE_BG
            self._write_row(
                ws, [bucket, count],
                PatternFill, Font, Alignment, Border, Side,
                bg_color=bg,
            )
        ws.append([])

        self._write_section_title(ws, "Scored By", Font, Alignment)
        self._write_headers(
            ws, ["Type", "Count", "Avg Score"],
            PatternFill, Font, Alignment, Border, Side
        )
        for s in d["scored_by"]:
            self._write_row(
                ws, [s["scored_by"], s["count"], _r(s["avg"])],
                PatternFill, Font, Alignment, Border, Side
            )

        self._auto_width(ws)

        #Sheet 2: Daily Trend
        ws2 = wb.create_sheet("Daily Trend")
        self._write_headers(
            ws2, ["Date", "Avg Score", "Count"],
            PatternFill, Font, Alignment, Border, Side
        )
        for t in d["daily_trend"]:
            self._write_row(
                ws2, [str(t["date"]), _r(t["avg_score"]), t["count"]],
                PatternFill, Font, Alignment, Border, Side
            )
        self._auto_width(ws2)

        #Sheet 3: Weekly Trend
        ws3 = wb.create_sheet("Weekly Trend")
        self._write_headers(
            ws3, ["Week", "Avg Score", "Count"],
            PatternFill, Font, Alignment, Border, Side
        )
        for t in d["weekly_trend"]:
            self._write_row(
                ws3, [str(t["week"]), _r(t["avg_score"]), t["count"]],
                PatternFill, Font, Alignment, Border, Side
            )
        self._auto_width(ws3)

        #Sheet 4: Criteria Trend
        ws4 = wb.create_sheet("Criteria Trend")
        self._write_headers(
            ws4, ["Date", "Accueil", "Empathie", "Resolution",
                  "Langage", "Conformité", "Clôture"],
            PatternFill, Font, Alignment, Border, Side
        )
        for t in d["criteria_trend"]:
            self._write_row(
                ws4, [
                    str(t["date"]),
                    _r(t["avg_accueil"]),
                    _r(t["avg_empathie"]),
                    _r(t["avg_resolution"]),
                    _r(t["avg_langage"]),
                    _r(t["avg_conformite"]),
                    _r(t["avg_cloture"]),
                ],
                PatternFill, Font, Alignment, Border, Side
            )
        self._auto_width(ws4)

        #Sheet 5: Agent Leaderboard
        ws5 = wb.create_sheet("Agent Leaderboard")
        self._write_headers(
            ws5, ["Agent", "Department", "Calls", "Avg Score",
                  "Min Score", "Max Score"],
            PatternFill, Font, Alignment, Border, Side
        )
        for a in d["agent_scores"]:
            avg = a.period_avg
            bg  = None
            if avg is not None:
                if avg >= 80: bg = self.POSITIVE_BG
                if avg < 40:  bg = self.NEGATIVE_BG
            self._write_row(
                ws5, [
                    a.user.email,
                    a.department or "-",
                    a.period_calls,
                    _r(a.period_avg),
                    _r(a.period_min),
                    _r(a.period_max),
                ],
                PatternFill, Font, Alignment, Border, Side,
                bg_color=bg,
            )
        self._auto_width(ws5)

        return self._to_bytes(wb)