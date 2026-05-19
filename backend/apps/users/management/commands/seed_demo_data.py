import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.analysis.models import QAReview, Score, Sentiment, Summary, Topic, Transcript
from apps.calls.models import AudioFile, Call, PipelineJob
from apps.users.models import Agent, Company, ScoringConfig, User


PASSWORD = "DemoPass123!"
COMPANY_NAME = "haAIdra Demo Center"


AGENTS = [
    ("maya.chen@haaidra.test", "Retention", 94, "Excellent ownership on billing and refund conversations."),
    ("omar.idrissi@haaidra.test", "Billing", 88, "Strong policy clarity. Add one more discovery question before plan changes."),
    ("leah.martin@haaidra.test", "Technical Support", 79, "Good structure. Needs tighter empathy language during escalations."),
    ("sam.rivera@haaidra.test", "Onboarding", 73, "Improve confirmation of customer goals before solutioning."),
    ("nora.benali@haaidra.test", "Enterprise Support", 91, "Consistently calm and compliant with high-value accounts."),
    ("ethan.kim@haaidra.test", "Collections", 68, "Needs coaching on tone, de-escalation, and next-step summaries."),
    ("ines.faraji@haaidra.test", "Technical Support", 84, "Reliable troubleshooting flow and professional language."),
    ("adam.wright@haaidra.test", "Sales", 81, "Good conversion skills. Keep compliance disclosure consistent."),
]


CALL_SCENARIOS = [
    {
        "title": "Billing dispute resolution",
        "customer": "+1-555-0101",
        "topics": ["Billing", "Refund", "Retention"],
        "motif": "Customer noticed a duplicate monthly charge and requested a refund.",
        "actions": "Agent verified the account, acknowledged the duplicate charge, and submitted a refund request.",
        "outcome": "Refund was confirmed and the customer kept the subscription active.",
        "recommendations": "Excellent empathy. Reduce silence by narrating account checks more clearly.",
        "sentiment": "positive",
    },
    {
        "title": "Technical escalation",
        "customer": "+1-555-0102",
        "topics": ["Technical Support", "Escalation", "Connectivity"],
        "motif": "Customer reported repeated connection failures after a software update.",
        "actions": "Agent performed basic troubleshooting, collected logs, and escalated to tier two support.",
        "outcome": "Issue was escalated with a clear case reference and follow-up window.",
        "recommendations": "Use more empathy before moving into diagnostic questions.",
        "sentiment": "neutral",
    },
    {
        "title": "Cancellation save attempt",
        "customer": "+1-555-0103",
        "topics": ["Cancellation", "Retention", "Product Fit"],
        "motif": "Customer wanted to cancel because they were not seeing enough value.",
        "actions": "Agent explored usage, offered a lower plan, and documented final cancellation preference.",
        "outcome": "Customer cancelled but left open to a future follow-up.",
        "recommendations": "Probe product-fit objections earlier and summarize value before concessions.",
        "sentiment": "negative",
    },
    {
        "title": "New subscription onboarding",
        "customer": "+1-555-0104",
        "topics": ["Onboarding", "Subscription", "Activation"],
        "motif": "New customer needed help activating their account and choosing initial settings.",
        "actions": "Agent walked through setup, confirmed notification preferences, and scheduled a check-in.",
        "outcome": "Customer completed onboarding and understood next steps.",
        "recommendations": "Strong close. Add a quick success metric question near the opening.",
        "sentiment": "positive",
    },
    {
        "title": "Plan downgrade request",
        "customer": "+1-555-0105",
        "topics": ["Plan Change", "Pricing", "Budget"],
        "motif": "Customer requested a downgrade due to budget pressure.",
        "actions": "Agent reviewed usage, explained feature tradeoffs, and processed the downgrade.",
        "outcome": "Downgrade completed with no unresolved actions.",
        "recommendations": "Add one retention discovery question before processing the request.",
        "sentiment": "neutral",
    },
    {
        "title": "Compliance disclosure review",
        "customer": "+1-555-0106",
        "topics": ["Compliance", "Verification", "Policy"],
        "motif": "Customer asked about account changes requiring identity verification.",
        "actions": "Agent verified identity, shared the recording disclosure, and completed the requested update.",
        "outcome": "Request completed with strong compliance adherence.",
        "recommendations": "Keep this call as a positive compliance example for onboarding.",
        "sentiment": "positive",
    },
]


def score_parts(total):
    ratio = max(0.35, min(total / 100, 1.0))
    return {
        "accueil": round(20 * ratio + random.uniform(-1.2, 1.2), 2),
        "empathie": round(20 * ratio + random.uniform(-2.0, 1.5), 2),
        "resolution": round(20 * ratio + random.uniform(-2.0, 2.0), 2),
        "langage": round(15 * ratio + random.uniform(-1.0, 1.0), 2),
        "conformite": round(15 * ratio + random.uniform(-1.5, 1.0), 2),
        "cloture": round(10 * ratio + random.uniform(-1.0, 1.0), 2),
    }


def transcript_segments(agent_email, scenario):
    agent_name = agent_email.split("@")[0].replace(".", " ").title()
    return [
        {
            "start": 0,
            "end": 8,
            "speaker": "Agent",
            "text": f"Thank you for calling haAIdra support, this is {agent_name}. This call may be recorded for quality assurance.",
        },
        {
            "start": 9,
            "end": 24,
            "speaker": "Customer",
            "text": f"I need help with this issue: {scenario['motif']}",
        },
        {
            "start": 25,
            "end": 50,
            "speaker": "Agent",
            "text": "I understand why that would be frustrating. Let me verify the account and look at the recent activity with you.",
        },
        {
            "start": 51,
            "end": 85,
            "speaker": "Agent",
            "text": scenario["actions"],
        },
        {
            "start": 86,
            "end": 110,
            "speaker": "Customer",
            "text": "That helps. Please send me the confirmation and next steps.",
        },
        {
            "start": 111,
            "end": 138,
            "speaker": "Agent",
            "text": f"{scenario['outcome']} Is there anything else I can help with today?",
        },
    ]


class Command(BaseCommand):
    help = "Seed a full haAIdra demo database for UI/UX testing."

    def add_arguments(self, parser):
        parser.add_argument("--calls", type=int, default=72, help="Number of demo calls to create.")
        parser.add_argument("--password", default=PASSWORD, help="Password for all demo users.")
        parser.add_argument(
            "--keep-existing-calls",
            action="store_true",
            help="Do not clear previous demo calls before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        random.seed(42)
        call_count = options["calls"]
        password = options["password"]

        company, _ = Company.objects.update_or_create(
            name=COMPANY_NAME,
            defaults={
                "plan": Company.Plan.ENTERPRISE,
                "is_active": True,
                "max_calls": 50000,
                "max_users": 250,
                "storage_quota": 102400,
            },
        )

        ScoringConfig.objects.update_or_create(
            company=company,
            is_active=True,
            defaults={
                "accueil_weight": "0.2000",
                "empathie_weight": "0.2000",
                "resolution_weight": "0.2000",
                "langage_weight": "0.1500",
                "conformite_weight": "0.1500",
                "cloture_weight": "0.1000",
            },
        )
        config = company.scoring_configs.filter(is_active=True).first()

        demo_users = [
            ("admin@haaidra.test", User.Role.ADMIN, True),
            ("manager@haaidra.test", User.Role.MANAGER, False),
            ("qa@haaidra.test", User.Role.QA_SUPERVISOR, False),
        ]

        users = {}
        for email, role, is_staff in demo_users:
            user, _ = User.objects.update_or_create(
                email=email,
                defaults={
                    "role": role,
                    "company": company,
                    "is_active": True,
                    "is_staff": is_staff,
                },
            )
            user.set_password(password)
            user.save(update_fields=["password", "company", "role", "is_active", "is_staff", "updated_at"])
            users[email] = user

        agents = []
        for index, (email, department, target_score, notes) in enumerate(AGENTS):
            user, _ = User.objects.update_or_create(
                email=email,
                defaults={
                    "role": User.Role.AGENT,
                    "company": company,
                    "is_active": True,
                    "phone": f"+1-555-020{index}",
                },
            )
            user.set_password(password)
            user.save(update_fields=["password", "company", "role", "is_active", "phone", "updated_at"])

            agent, _ = Agent.objects.update_or_create(
                user=user,
                defaults={
                    "company": company,
                    "department": department,
                    "hire_date": timezone.localdate() - timedelta(days=330 + index * 37),
                    "status": Agent.Status.ACTIVE if index != len(AGENTS) - 1 else Agent.Status.INACTIVE,
                    "avg_score": target_score,
                    "coaching_notes": notes,
                },
            )
            agents.append(agent)

        if not options["keep_existing_calls"]:
            Call.all_objects.filter(company=company, client_phone__startswith="+1-555-01").hard_delete()

        now = timezone.now()
        created_calls = []

        for index in range(call_count):
            agent = agents[index % len(agents)]
            scenario = CALL_SCENARIOS[index % len(CALL_SCENARIOS)]
            days_back = index % 45
            uploaded_at = now - timedelta(days=days_back, hours=random.randint(0, 10), minutes=random.randint(0, 55))
            duration = random.randint(190, 780)
            base_score = max(45, min(98, int(agent.avg_score + random.randint(-13, 9))))
            status = Call.Status.ANALYZED

            if index % 17 == 0:
                status = Call.Status.PENDING
            elif index % 23 == 0:
                status = Call.Status.PROCESSING
            elif index % 31 == 0:
                status = Call.Status.FAILED

            sentiment_label = scenario["sentiment"]
            if base_score < 70:
                sentiment_label = Sentiment.Label.NEGATIVE
            elif base_score < 82 and sentiment_label == Sentiment.Label.POSITIVE:
                sentiment_label = Sentiment.Label.NEUTRAL

            call = Call.objects.create(
                company=company,
                agent=agent,
                uploaded_by=users["manager@haaidra.test"],
                client_phone=f"{scenario['customer']}-{index:03d}",
                language=random.choice([Call.Language.ENGLISH, Call.Language.FRENCH, Call.Language.ARABIC]),
                channel=random.choice([Call.Channel.INBOUND, Call.Channel.OUTBOUND]),
                file_format=random.choice([Call.FileFormat.MP3, Call.FileFormat.WAV, Call.FileFormat.M4A]),
                file_size=random.randint(800_000, 8_000_000),
                duration=duration,
                status=status,
                tags=["demo", scenario["title"].lower().replace(" ", "-")],
                is_flagged=base_score < 72 or sentiment_label == Sentiment.Label.NEGATIVE,
                resolution_status=random.choice([
                    Call.ResolutionStatus.RESOLVED,
                    Call.ResolutionStatus.RESOLVED,
                    Call.ResolutionStatus.UNRESOLVED,
                    Call.ResolutionStatus.ESCALATED,
                ]),
            )
            Call.objects.filter(id=call.id).update(uploaded_at=uploaded_at, created_at=uploaded_at, updated_at=uploaded_at)
            call.uploaded_at = uploaded_at
            created_calls.append(call)

            AudioFile.objects.create(
                call=call,
                s3_key=f"demo/{company.tenant_id}/{call.id}/recording.{call.file_format}",
                s3_url=f"https://example.com/demo-audio/{call.id}.{call.file_format}",
                checksum=f"demo-checksum-{index:04d}",
                file_size=call.file_size,
            )

            job_status = PipelineJob.Status.DONE if status == Call.Status.ANALYZED else PipelineJob.Status.QUEUED
            current_step = None
            if status == Call.Status.PROCESSING:
                job_status = PipelineJob.Status.RUNNING
                current_step = random.choice(list(PipelineJob.Step.values))
            elif status == Call.Status.FAILED:
                job_status = PipelineJob.Status.FAILED

            PipelineJob.objects.create(
                call=call,
                status=job_status,
                current_step=current_step,
                retry_count=random.randint(0, 2) if status == Call.Status.FAILED else 0,
                error_message="Demo transcription timeout" if status == Call.Status.FAILED else "",
                started_at=uploaded_at + timedelta(minutes=1) if status != Call.Status.PENDING else None,
                finished_at=uploaded_at + timedelta(minutes=random.randint(4, 14)) if status == Call.Status.ANALYZED else None,
            )

            if status != Call.Status.ANALYZED:
                continue

            segments = transcript_segments(agent.user.email, scenario)
            Transcript.objects.create(
                call=call,
                language_detected=call.language,
                word_error_rate=round(random.uniform(0.02, 0.12), 3),
                duration=duration,
                segments=segments,
            )

            Sentiment.objects.create(
                call=call,
                overall_label=sentiment_label,
                overall_score=round((base_score - 50) / 50, 2),
                segments=[
                    {"start": segment["start"], "end": segment["end"], "label": sentiment_label, "score": round(random.uniform(0.45, 0.95), 2)}
                    for segment in segments
                ],
            )

            Topic.objects.create(
                call=call,
                topics=[
                    {"label": label, "score": round(random.uniform(0.68, 0.97), 2)}
                    for label in scenario["topics"]
                ],
            )

            parts = score_parts(base_score)
            score = Score.objects.create(
                call=call,
                config=config,
                ai_total=base_score,
                scored_by=Score.ScoredBy.AI,
                **parts,
            )
            score.compute_total()
            score.ai_total = score.total
            score.save(update_fields=["total", "ai_total", "updated_at"])

            Summary.objects.create(
                call=call,
                motif=scenario["motif"],
                actions=scenario["actions"],
                outcome=scenario["outcome"],
                recommendations=scenario["recommendations"],
            )

            review_status = random.choice([QAReview.Status.PENDING, QAReview.Status.APPROVED, QAReview.Status.APPROVED, QAReview.Status.REJECTED])
            reviewer = users["qa@haaidra.test"] if review_status != QAReview.Status.PENDING else None
            QAReview.objects.create(
                call=call,
                reviewer=reviewer,
                original_ai_score=score.total,
                score_override=round(score.total + random.uniform(-4, 4), 2) if review_status == QAReview.Status.REJECTED else None,
                is_overridden=review_status == QAReview.Status.REJECTED,
                override_reason="Demo QA adjustment for coaching calibration." if review_status == QAReview.Status.REJECTED else "",
                comment="Demo review generated for UI testing.",
                status=review_status,
                reviewed_at=uploaded_at + timedelta(hours=4) if reviewer else None,
            )

        for agent in agents:
            agent_calls = [call for call in created_calls if call.agent_id == agent.id]
            analyzed_scores = list(Score.objects.filter(call__in=agent_calls).values_list("total", flat=True))
            agent.total_calls = len(agent_calls)
            agent.avg_score = round(sum(analyzed_scores) / len(analyzed_scores), 2) if analyzed_scores else 0
            agent.save(update_fields=["total_calls", "avg_score", "updated_at"])

        self.stdout.write(self.style.SUCCESS("haAIdra demo database seeded."))
        self.stdout.write(f"Company: {company.name}")
        self.stdout.write(f"Calls created: {len(created_calls)}")
        self.stdout.write("Demo logins:")
        self.stdout.write(f"  admin@haaidra.test / {password}")
        self.stdout.write(f"  manager@haaidra.test / {password}")
        self.stdout.write(f"  qa@haaidra.test / {password}")
        self.stdout.write(f"  {AGENTS[0][0]} / {password}")
