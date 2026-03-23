from django.utils import timezone



class BasePDFGenerator:

    TITLE = "CallSight AI Report"

    PRIMARY   = "#4A4A9C"
    SECONDARY = "#6B6BB5"
    LIGHT     = "#E8E8F5"
    TEXT      = "#333333"
    MUTED     = "#888888"

    BASE_CSS = """
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            color: #333;
            padding: 20px;
        }
        .header {
            border-bottom: 3px solid #4A4A9C;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .header h1 { color: #4A4A9C; font-size: 20px; }
        .header .meta { color: #888; font-size: 10px; margin-top: 4px; }
        .section { margin-bottom: 20px; }
        .section h2 {
            color: #4A4A9C;
            font-size: 13px;
            border-left: 4px solid #4A4A9C;
            padding-left: 8px;
            margin-bottom: 10px;
        }
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 16px;
        }
        .kpi-card {
            background: #E8E8F5;
            border-radius: 6px;
            padding: 10px;
            text-align: center;
        }
        .kpi-card .value { font-size: 22px; font-weight: bold; color: #4A4A9C; }
        .kpi-card .label { font-size: 9px; color: #888; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background: #4A4A9C; color: white; padding: 6px 8px; text-align: left; }
        td { padding: 5px 8px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #F9F9FF; }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 9px;
            font-weight: bold;
        }
        .badge-positive { background: #d4edda; color: #155724; }
        .badge-negative { background: #f8d7da; color: #721c24; }
        .badge-neutral  { background: #e2e3e5; color: #383d41; }
        .badge-flagged  { background: #fff3cd; color: #856404; }
        .footer {
            border-top: 1px solid #eee;
            padding-top: 8px;
            margin-top: 20px;
            color: #aaa;
            font-size: 9px;
            text-align: center;
        }
    """

    def __init__(self, company, date_from, date_to):
        self.company   = company
        self.date_from = date_from
        self.date_to   = date_to

    def _build_html(self):
        raise NotImplementedError("Subclasses must implement _build_html()")

    def _header_html(self, subtitle=""):
        return f"""
        <div class="header">
            <h1>CallSight AI — {self.TITLE}</h1>
            <div class="meta">
                Company: <strong>{self.company.name}</strong> &nbsp;|&nbsp;
                Period: <strong>{self.date_from} → {self.date_to}</strong> &nbsp;|&nbsp;
                Generated: <strong>{timezone.now().strftime('%Y-%m-%d %H:%M UTC')}</strong>
                {f'<br>{subtitle}' if subtitle else ''}
            </div>
        </div>
        """

    def _footer_html(self):
        return f"""
        <div class="footer">
            CallSight AI &nbsp;·&nbsp; {self.company.name} &nbsp;·&nbsp;
            {timezone.now().strftime('%Y-%m-%d %H:%M UTC')}
        </div>
        """

    def _kpi_card(self, value, label):
        return f"""
        <div class="kpi-card">
            <div class="value">{value}</div>
            <div class="label">{label}</div>
        </div>
        """

    def _kpi_grid(self, cards):
        """cards = list of (value, label) tuples."""
        inner = "".join(self._kpi_card(v, l) for v, l in cards)
        return f'<div class="kpi-grid">{inner}</div>'

    def _table(self, headers, rows):
        ths  = "".join(f"<th>{h}</th>" for h in headers)
        trs  = ""
        for row in rows:
            tds = "".join(f"<td>{cell}</td>" for cell in row)
            trs += f"<tr>{tds}</tr>"
        return f"<table><thead><tr>{ths}</tr></thead><tbody>{trs}</tbody></table>"

    def generate(self):
        """Returns PDF bytes."""
        try:
            from weasyprint import HTML, CSS
            html = self._build_html()
            return HTML(string=html).write_pdf(
                stylesheets=[CSS(string=self.BASE_CSS)]
            )
        except ImportError:
            raise ImportError(
                "WeasyPrint is not installed. Run: pip install weasyprint"
            )