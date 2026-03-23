"""
apps/reports/views.py

Report generation views — PDF, Excel, CSV.
All views are tenant-scoped and require Manager+ role.

Routes:
    GET /api/v1/reports/company/          — Company monthly report
    GET /api/v1/reports/agent/{id}/       — Agent monthly report
    GET /api/v1/reports/call-quality/     — Call quality report
    GET /api/v1/reports/sentiment/        — Sentiment analysis report
    GET /api/v1/reports/qa/               — QA review report
    GET /api/v1/reports/scores/           — Score performance report
    GET /api/v1/reports/flagged/          — Flagged calls report
    GET /api/v1/reports/topics/           — Topic frequency report
    GET /api/v1/reports/comparative/      — Comparative agent report

Query params:
    ?format=pdf|excel|csv
    ?month=3&year=2026
    ?from=2026-01-01&to=2026-03-31
    ?agent_id=uuid         (optional, scopes to one agent)
    ?agent_ids=uuid,uuid   (comparative report only)
    ?limit=20              (topics report only)
"""

import logging
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.users.permissions import IsManager, IsQASupervisor
from .generators import (
    get_date_range, get_format,
    CompanyMonthlyPDF,  CompanyMonthlyExcel,
    AgentMonthlyPDF,    AgentMonthlyExcel,
    CallQualityPDF,     CallQualityExcel,
    SentimentReportPDF, SentimentReportExcel,
    QAReviewReportPDF,  QAReviewReportExcel,
    ScoreReportPDF,     ScoreReportExcel,
    FlaggedCallsReportPDF, FlaggedCallsReportExcel,
    TopicsReportPDF,    TopicsReportExcel,
    ComparativeReportPDF, ComparativeReportExcel,
)

logger = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _pdf_response(pdf_bytes, filename):
    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{filename}.pdf"'
    return response


def _excel_response(excel_bytes, filename):
    response = HttpResponse(
        excel_bytes,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response["Content-Disposition"] = f'attachment; filename="{filename}.xlsx"'
    return response


def _build_filename(report_type, company, date_from, date_to):
    return f"callsight_{report_type}_{company.name}_{date_from}_{date_to}".replace(" ", "_")


def _handle_report(request, pdf_cls, excel_cls, filename, **kwargs):
    """
    Generic handler — builds the correct report type based on ?format=
    and returns the appropriate HTTP response.
    """
    fmt        = get_format(request)
    date_from, date_to = get_date_range(request)
    company    = request.user.company

    try:
        if fmt == "pdf":
            gen   = pdf_cls(company, date_from, date_to, **kwargs)
            data  = gen.generate()
            return _pdf_response(data, filename)
        else:
            gen   = excel_cls(company, date_from, date_to, **kwargs)
            data  = gen.generate()
            return _excel_response(data, filename)

    except ImportError as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )
    except Exception as e:
        logger.error("Report generation failed: %s", e)
        return Response(
            {"detail": "Report generation failed.", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ── Views ─────────────────────────────────────────────────────────────────────

class CompanyReportView(APIView):
    """GET /api/v1/reports/company/?format=pdf|excel&month=3&year=2026"""
    permission_classes = [IsManager]

    def get(self, request):
        date_from, date_to = get_date_range(request)
        filename = _build_filename("company", request.user.company, date_from, date_to)
        return _handle_report(request, CompanyMonthlyPDF, CompanyMonthlyExcel, filename)


class AgentReportView(APIView):
    """GET /api/v1/reports/agent/{agent_id}/?format=pdf|excel"""
    permission_classes = [IsManager]

    def get(self, request, agent_id):
        date_from, date_to = get_date_range(request)
        filename = _build_filename("agent", request.user.company, date_from, date_to)
        return _handle_report(
            request,
            AgentMonthlyPDF, AgentMonthlyExcel,
            filename,
            agent_id=agent_id,
        )


class CallQualityReportView(APIView):
    """GET /api/v1/reports/call-quality/?format=pdf|excel&agent_id=uuid"""
    permission_classes = [IsManager]

    def get(self, request):
        agent_id   = request.query_params.get("agent_id")
        date_from, date_to = get_date_range(request)
        filename   = _build_filename("call_quality", request.user.company, date_from, date_to)
        return _handle_report(
            request,
            CallQualityPDF, CallQualityExcel,
            filename,
            agent_id=agent_id,
        )


class SentimentReportView(APIView):
    """GET /api/v1/reports/sentiment/?format=pdf|excel&agent_id=uuid"""
    permission_classes = [IsManager]

    def get(self, request):
        agent_id   = request.query_params.get("agent_id")
        date_from, date_to = get_date_range(request)
        filename   = _build_filename("sentiment", request.user.company, date_from, date_to)
        return _handle_report(
            request,
            SentimentReportPDF, SentimentReportExcel,
            filename,
            agent_id=agent_id,
        )


class QAReviewReportView(APIView):
    """GET /api/v1/reports/qa/?format=pdf|excel"""
    permission_classes = [IsQASupervisor]

    def get(self, request):
        date_from, date_to = get_date_range(request)
        filename = _build_filename("qa_review", request.user.company, date_from, date_to)
        return _handle_report(request, QAReviewReportPDF, QAReviewReportExcel, filename)


class ScoreReportView(APIView):
    """GET /api/v1/reports/scores/?format=pdf|excel&agent_id=uuid"""
    permission_classes = [IsManager]

    def get(self, request):
        agent_id   = request.query_params.get("agent_id")
        date_from, date_to = get_date_range(request)
        filename   = _build_filename("scores", request.user.company, date_from, date_to)
        return _handle_report(
            request,
            ScoreReportPDF, ScoreReportExcel,
            filename,
            agent_id=agent_id,
        )


class FlaggedReportView(APIView):
    """GET /api/v1/reports/flagged/?format=pdf|excel&agent_id=uuid"""
    permission_classes = [IsManager]

    def get(self, request):
        agent_id   = request.query_params.get("agent_id")
        date_from, date_to = get_date_range(request)
        filename   = _build_filename("flagged", request.user.company, date_from, date_to)
        return _handle_report(
            request,
            FlaggedCallsReportPDF, FlaggedCallsReportExcel,
            filename,
            agent_id=agent_id,
        )


class TopicsReportView(APIView):
    """GET /api/v1/reports/topics/?format=pdf|excel&limit=20"""
    permission_classes = [IsManager]

    def get(self, request):
        agent_id   = request.query_params.get("agent_id")
        limit      = int(request.query_params.get("limit", 20))
        date_from, date_to = get_date_range(request)
        filename   = _build_filename("topics", request.user.company, date_from, date_to)
        return _handle_report(
            request,
            TopicsReportPDF, TopicsReportExcel,
            filename,
            agent_id=agent_id,
            limit=limit,
        )


class ComparativeReportView(APIView):
    """
    GET /api/v1/reports/comparative/?format=pdf|excel&agent_ids=uuid,uuid
    If no agent_ids provided, compares all active agents.
    """
    permission_classes = [IsManager]

    def get(self, request):
        agent_ids_param = request.query_params.get("agent_ids")
        agent_ids = None
        if agent_ids_param:
            agent_ids = [a.strip() for a in agent_ids_param.split(",") if a.strip()]

        date_from, date_to = get_date_range(request)
        filename = _build_filename("comparative", request.user.company, date_from, date_to)
        return _handle_report(
            request,
            ComparativeReportPDF, ComparativeReportExcel,
            filename,
            agent_ids=agent_ids,
        )