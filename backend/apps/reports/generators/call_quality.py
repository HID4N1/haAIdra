from django.db.models import Avg, Count, Q, Min, Max
from apps.calls.models import Call
from apps.analysis.models import Score, Sentiment, Transcript
from .pdf_base import BasePDFGenerator
from .excel_base import BaseExcelGenerator


def _get_data(company, date_from, date_to, agent_id=None):
    """Shared data fetching for both PDF and Excel."""
    call_filter = dict(
        company=company,
        uploaded_at__date__gte=date_from,
        uploaded_at__date__lte=date_to,
        status="analyzed",
    )
    if agent_id:
        call_filter["agent_id"] = agent_id

    calls = Call.objects.filter(**call_filter).select_related(
        "agent__user", "score", "sentiment", "transcript"
    )

    score_agg = Score.objects.filter(
        call__company=company,
        call__uploaded_at__date__gte=date_from,
        call__uploaded_at__date__lte=date_to,
        **({f"call__agent_id": agent_id} if agent_id else {}),
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

    # Score distribution buckets
    scores     = Score.objects.filter(
        call__company=company,
        call__uploaded_at__date__gte=date_from,
        call__uploaded_at__date__lte=date_to,
    ).values_list("total", flat=True)

    buckets = {"0-20": 0, "20-40": 0, "40-60": 0, "60-80": 0, "80-100": 0}
    for s in scores:
        if s < 20:    buckets["0-20"]   += 1
        elif s < 40:  buckets["20-40"]  += 1
        elif s < 60:  buckets["40-60"]  += 1
        elif s < 80:  buckets["60-80"]  += 1
        else:         buckets["80-100"] += 1

    # Top 10 and bottom 10 calls by score
    top_calls    = calls.order_by("-score__total")[:10]
    bottom_calls = calls.order_by("score__total")[:10]

    return {
        "calls":        calls,
        "total":        calls.count(),
        "score_agg":    score_agg,
        "buckets":      buckets,
        "top_calls":    list(top_calls),
        "bottom_calls": list(bottom_calls),
    }


def _r(val, n=2):
    try:
        return round(float(val), n) if val is not None else "-"
    except (TypeError, ValueError):
        return "-"


def _call_row(call):
    score = getattr(call, "score",     None)
    sent  = getattr(call, "sentiment", None)
    trans = getattr(call, "transcript", None)
    return [
        str(call.id),
        call.agent.user.email if call.agent else "-",
        call.uploaded_at.strftime("%Y-%m-%d"),
        call.channel,
        call.language,
        _r(score.total)        if score else "-",
        _r(score.accueil)      if score else "-",
        _r(score.empathie)     if score else "-",
        _r(score.resolution)   if score else "-",
        _r(score.langage)      if score else "-",
        _r(score.conformite)   if score else "-",
        _r(score.cloture)      if score else "-",
        sent.overall_label     if sent  else "-",
        _r(trans.word_error_rate) if trans else "-",
        "Yes" if call.is_flagged else "No",
        call.resolution_status,
    ]


CALL_HEADERS = [
    "Call ID", "Agent", "Date", "Channel", "Language",
    "Total", "Accueil", "Empathie", "Resolution",
    "Langage", "Conformité", "Clôture",
    "Sentiment", "WER", "Flagged", "Resolution Status",
]


#PDF

class CallQualityPDF(BasePDFGenerator):
    TITLE = "Call Quality Report"

    def __init__(self, company, date_from, date_to, agent_id=None):
        super().__init__(company, date_from, date_to)
        self.agent_id = agent_id

    def _build_html(self):
        d = _get_data(self.company, self.date_from, self.date_to, self.agent_id)

        kpis = self._kpi_grid([
            (d["total"],                           "Analyzed Calls"),
            (_r(d["score_agg"]["avg_total"]),      "Avg Score"),
            (_r(d["score_agg"]["min_total"]),      "Min Score"),
            (_r(d["score_agg"]["max_total"]),      "Max Score"),
        ])

        criteria_rows = [
            ["Accueil",    _r(d["score_agg"]["avg_accueil"])],
            ["Empathie",   _r(d["score_agg"]["avg_empathie"])],
            ["Resolution", _r(d["score_agg"]["avg_resolution"])],
            ["Langage",    _r(d["score_agg"]["avg_langage"])],
            ["Conformité", _r(d["score_agg"]["avg_conformite"])],
            ["Clôture",    _r(d["score_agg"]["avg_cloture"])],
        ]
        criteria_table = self._table(["Criteria", "Avg Score"], criteria_rows)

        bucket_rows = [[k, v] for k, v in d["buckets"].items()]
        bucket_table = self._table(["Score Range", "Count"], bucket_rows)

        top_table    = self._table(CALL_HEADERS, [_call_row(c) for c in d["top_calls"]])
        bottom_table = self._table(CALL_HEADERS, [_call_row(c) for c in d["bottom_calls"]])

        return f"""
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body>
            {self._header_html()}
            <div class="section">
                <h2>Quality KPIs</h2>
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
                <h2>Top 10 Calls</h2>
                {top_table}
            </div>
            <div class="section">
                <h2>Bottom 10 Calls</h2>
                {bottom_table}
            </div>
            {self._footer_html()}
        </body></html>
        """


#Excel

class CallQualityExcel(BaseExcelGenerator):
    TITLE      = "Call Quality Report"
    SHEET_NAME = "Call Quality"

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

        self._write_section_title(ws, "Quality KPIs", Font, Alignment)
        self._write_kpi_section(ws, [
            ("Analyzed Calls", d["total"]),
            ("Avg Score",      _r(d["score_agg"]["avg_total"])),
            ("Min Score",      _r(d["score_agg"]["min_total"])),
            ("Max Score",      _r(d["score_agg"]["max_total"])),
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
                ws, [criteria, _r(d["score_agg"][key])],
                PatternFill, Font, Alignment, Border, Side
            )
        ws.append([])

        self._write_section_title(ws, "Score Distribution", Font, Alignment)
        self._write_headers(
            ws, ["Score Range", "Count"],
            PatternFill, Font, Alignment, Border, Side
        )
        for bucket, count in d["buckets"].items():
            self._write_row(
                ws, [bucket, count],
                PatternFill, Font, Alignment, Border, Side
            )

        self._auto_width(ws)

        #Sheet 2: All Calls
        ws2 = wb.create_sheet("All Calls")
        self._write_headers(
            ws2, CALL_HEADERS,
            PatternFill, Font, Alignment, Border, Side
        )
        for call in d["calls"].select_related("score", "sentiment", "transcript"):
            score = getattr(call, "score",     None)
            sent  = getattr(call, "sentiment", None)
            bg    = None
            if sent:
                if sent.overall_label == "positive": bg = self.POSITIVE_BG
                if sent.overall_label == "negative": bg = self.NEGATIVE_BG
            self._write_row(
                ws2, _call_row(call),
                PatternFill, Font, Alignment, Border, Side,
                bg_color=bg,
            )
        self._auto_width(ws2)
        self._freeze_pane(ws2, "A2")

        #Sheet 3: Top 10
        ws3 = wb.create_sheet("Top 10")
        self._write_headers(
            ws3, CALL_HEADERS,
            PatternFill, Font, Alignment, Border, Side
        )
        for call in d["top_calls"]:
            self._write_row(
                ws3, _call_row(call),
                PatternFill, Font, Alignment, Border, Side,
                bg_color=self.POSITIVE_BG,
            )
        self._auto_width(ws3)

        # Sheet 4: Bottom 10
        ws4 = wb.create_sheet("Bottom 10")
        self._write_headers(
            ws4, CALL_HEADERS,
            PatternFill, Font, Alignment, Border, Side
        )
        for call in d["bottom_calls"]:
            self._write_row(
                ws4, _call_row(call),
                PatternFill, Font, Alignment, Border, Side,
                bg_color=self.NEGATIVE_BG,
            )
        self._auto_width(ws4)

        return self._to_bytes(wb)