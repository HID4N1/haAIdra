from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Agent


@receiver(post_save, sender=User)
def sync_agent_profile(sender, instance, created, **kwargs):
    
    if instance.role != User.Role.AGENT:
        return

    if created:
        if instance.company:
            Agent.objects.get_or_create(
                user=instance,
                defaults={"company": instance.company},
            )
    else:
        try:
            agent = instance.agent_profile
            if instance.company and agent.company_id != instance.company_id:
                agent.company = instance.company
                agent.save(update_fields=["company", "updated_at"])
        except Agent.DoesNotExist:
            if instance.company:
                Agent.objects.create(user=instance, company=instance.company)