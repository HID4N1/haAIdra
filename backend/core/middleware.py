class TenantScopeMiddleware:
    """
    Attaches the user's company (tenant) to the request object.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, "user", None)

        if user and user.is_authenticated:
            request.tenant = getattr(user, "company", None)
        else:
            request.tenant = None

        return self.get_response(request)