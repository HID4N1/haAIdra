from rest_framework.renderers import JSONRenderer


class EnvelopeRenderer(JSONRenderer):

    def render(self, data, accepted_media_type=None, renderer_context=None):

        if renderer_context:
            response = renderer_context.get("response")
            if response and response.status_code >= 400:
                return super().render(data, accepted_media_type, renderer_context)

        envelope = {
            "success": True,
            "data": data,
        }

        return super().render(envelope, accepted_media_type, renderer_context)