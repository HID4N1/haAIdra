"""
apps/reports/generators/topics.py

Topic frequency report — PDF + Excel.
Covers: topic summary, top topics, topic trend over time,
        topic distribution per agent, topic-sentiment correlation.
"""

from collections import Counter
from django.db.models import Count, Q, Avg
from django.db.models.functions import TruncDate, TruncWeek
from apps.analysis.models import Topic, Sentiment
from apps.calls.models import Call
from .pdf_base import BasePDFGenerator
from .excel_base import BaseExcelGenerator


def _get_data(company, date_from, date_to, agent_id=None, limit=20):
    """Shared data fetching for both PDF and Excel."""
    call_filter = dict(
        call__company=company,
        call__uploaded_at__date__gte=date_from,
        call__uploaded_at__date__lte=date_to,
    )
    if agent_id:
        call_filter["call__agent_id"] = agent_id

    topics_qs = Topic.objects.filter(**call_filter).select_related(
        "call__agent__user", "call__sentiment"
    )

    # Overall topic frequency
    counter = Counter()
    topic_sentiment = {}  # label -> {positive, neutral, negative}

    for topic_obj in topics_qs:
        sent_label = None
        if hasattr(topic_obj.call, "sentiment"):
            sent_label = topic_obj.call.sentiment.overall_label

        for item in (topic_obj.topics or []):
            label = item.get("label")
            if not label:
                continue
            counter[label] += 1

            if sent_label:
                if label not in topic_sentiment:
                    topic_sentiment[label] = {
                        "positive": 0, "neutral": 0, "negative": 0
                    }
                topic_sentiment[label][sent_label] = (
                    topic_sentiment[label].get(sent_label, 0) + 1
                )

    top_topics = counter.most_common(limit)

    # Topic trend — weekly
    all_topics_by_week = {}
    topics_with_date = Topic.objects.filter(**call_filter).select_related("call")
    for topic_obj in topics_with_date:
        week = topic_obj.call.uploaded_at.strftime("%Y-W%W")
        for item in (topic_obj.topics or []):
            label = item.get("label")
            if label:
                key = (week, label)
                all_topics_by_week[key] = all_topics_by_week.get(key, 0) + 1

    weekly_trend = [
        {"week": k[0], "label": k[1], "count": v}
        for k, v in sorted(all_topics_by_week.items())
        if k[1] in dict(top_topics)
    ]

    # Per-agent topic distribution
    agent_topics = {}
    for topic_obj in topics_qs:
        email = (
            topic_obj.call.agent.user.email
            if topic_obj.call.agent else "unknown"
        )
        for item in (topic_obj.topics or []):
            label = item.get("label")
            if label:
                if email not in agent_topics:
                    agent_topics[email] = Counter()
                agent_topics[email][label] += 1

    agent_top = {
        email: counts.most_common(5)
        for email, counts in agent_topics.items()
    }

    total_calls = topics_qs.count()

    return {
        "total_calls":    total_calls,
        "top_topics":     top_topics,
        "topic_sentiment": topic_sentiment,
        "weekly_trend":   weekly_trend,
        "agent_top":      agent_top,
        "total_unique":   len(counter),
    }


def _r(val, n=2):
    try:
        return round(float(val), n) if val is not None else "-"
    except (TypeError, ValueError):
        return "-"


#PDF

class TopicsReportPDF(BasePDFGenerator):
    TITLE = "Topic Frequency Report"

    def __init__(self, company, date_from, date_to, agent_id=None, limit=20):
        super().__init__(company, date_from, date_to)
        self.agent_id = agent_id
        self.limit    = limit

    def _build_html(self):
        d = _get_data(
            self.company, self.date_from, self.date_to,
            self.agent_id, self.limit
        )

        kpis = self._kpi_grid([
            (d["total_calls"],   "Analyzed Calls"),
            (d["total_unique"],  "Unique Topics"),
            (len(d["top_topics"]), "Top Topics"),
            (len(d["agent_top"]), "Agents"),
        ])

        topic_rows = [
            [
                label,
                count,
                round(count / (d["total_calls"] or 1) * 100, 1),
                d["topic_sentiment"].get(label, {}).get("positive", 0),
                d["topic_sentiment"].get(label, {}).get("neutral",  0),
                d["topic_sentiment"].get(label, {}).get("negative", 0),
            ]
            for label, count in d["top_topics"]
        ]
        topic_table = self._table(
            ["Topic", "Count", "% Calls", "Positive", "Neutral", "Negative"],
            topic_rows
        )

        agent_rows = []
        for email, topics in d["agent_top"].items():
            for label, count in topics:
                agent_rows.append([email, label, count])
        agent_table = self._table(["Agent", "Topic", "Count"], agent_rows)

        trend_rows  = [
            [t["week"], t["label"], t["count"]]
            for t in d["weekly_trend"]
        ]
        trend_table = self._table(["Week", "Topic", "Count"], trend_rows)

        return f"""
        <!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body>
            {self._header_html()}
            <div class="section">
                <h2>Topic Summary</h2>
                {kpis}
            </div>
            <div class="section">
                <h2>Top {self.limit} Topics</h2>
                {topic_table}
            </div>
            <div class="section">
                <h2>Top Topics per Agent</h2>
                {agent_table}
            </div>
            <div class="section">
                <h2>Weekly Topic Trend</h2>
                {trend_table}
            </div>
            {self._footer_html()}
        </body></html>
        """


#Excel

class TopicsReportExcel(BaseExcelGenerator):
    TITLE      = "Topic Frequency Report"
    SHEET_NAME = "Topics"

    def __init__(self, company, date_from, date_to, agent_id=None, limit=20):
        super().__init__(company, date_from, date_to)
        self.agent_id = agent_id
        self.limit    = limit

    def generate(self):
        Workbook, PatternFill, Font, Alignment, Border, Side, get_col = self._imports()
        wb = Workbook()

        d = _get_data(
            self.company, self.date_from, self.date_to,
            self.agent_id, self.limit
        )

        #Sheet 1: Summary
        ws = wb.active
        ws.title = "Summary"

        self._write_title(ws, Font, Alignment)
        self._write_meta(ws, Font, Alignment)

        self._write_section_title(ws, "Topic Summary", Font, Alignment)
        self._write_kpi_section(ws, [
            ("Analyzed Calls", d["total_calls"]),
            ("Unique Topics",  d["total_unique"]),
            ("Top Topics",     len(d["top_topics"])),
            ("Agents",         len(d["agent_top"])),
        ], PatternFill, Font, Alignment, Border, Side)

        #Sheet 2: Top Topics
        ws2 = wb.create_sheet(f"Top {self.limit} Topics")
        self._write_headers(
            ws2, [
                "Topic", "Count", "% Calls",
                "Positive", "Neutral", "Negative"
            ],
            PatternFill, Font, Alignment, Border, Side
        )
        for label, count in d["top_topics"]:
            pct  = round(count / (d["total_calls"] or 1) * 100, 1)
            sent = d["topic_sentiment"].get(label, {})
            pos  = sent.get("positive", 0)
            neu  = sent.get("neutral",  0)
            neg  = sent.get("negative", 0)
            bg   = self.POSITIVE_BG if pos > neg else (
                   self.NEGATIVE_BG if neg > pos else None
            )
            self._write_row(
                ws2, [label, count, f"{pct}%", pos, neu, neg],
                PatternFill, Font, Alignment, Border, Side,
                bg_color=bg,
            )
        self._auto_width(ws2)

        #Sheet 3: Topic-Sentiment Correlation
        ws3 = wb.create_sheet("Sentiment Correlation")
        self._write_headers(
            ws3, ["Topic", "Positive", "Neutral", "Negative", "Total",
                  "Positive %", "Negative %"],
            PatternFill, Font, Alignment, Border, Side
        )
        for label, count in d["top_topics"]:
            sent  = d["topic_sentiment"].get(label, {})
            pos   = sent.get("positive", 0)
            neu   = sent.get("neutral",  0)
            neg   = sent.get("negative", 0)
            total = pos + neu + neg or 1
            self._write_row(
                ws3, [
                    label,
                    pos, neu, neg, total,
                    f"{round(pos/total*100,1)}%",
                    f"{round(neg/total*100,1)}%",
                ],
                PatternFill, Font, Alignment, Border, Side
            )
        self._auto_width(ws3)

        #Sheet 4: Per-Agent Topics
        ws4 = wb.create_sheet("Per Agent")
        self._write_headers(
            ws4, ["Agent", "Topic", "Count"],
            PatternFill, Font, Alignment, Border, Side
        )
        for email, topics in d["agent_top"].items():
            for label, count in topics:
                self._write_row(
                    ws4, [email, label, count],
                    PatternFill, Font, Alignment, Border, Side
                )
        self._auto_width(ws4)

        #Sheet 5: Weekly Trend
        ws5 = wb.create_sheet("Weekly Trend")
        self._write_headers(
            ws5, ["Week", "Topic", "Count"],
            PatternFill, Font, Alignment, Border, Side
        )
        for t in d["weekly_trend"]:
            self._write_row(
                ws5, [t["week"], t["label"], t["count"]],
                PatternFill, Font, Alignment, Border, Side
            )
        self._auto_width(ws5)

        return self._to_bytes(wb)