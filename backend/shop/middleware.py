from django.contrib.sessions.models import Session
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication


class BearerSessionAuthentication(BaseAuthentication):
    """
    DRF authentication class that verifies a session key passed via
    `Authorization: Bearer <session_key>` or `X-Session-Key: <session_key>`.
    Does not require CSRF token for mobile API calls.
    """
    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        session_key = ""
        if auth_header.startswith("Bearer "):
            session_key = auth_header.split(" ", 1)[1].strip()
        elif "HTTP_X_SESSION_KEY" in request.META:
            session_key = request.META.get("HTTP_X_SESSION_KEY", "").strip()

        if not session_key:
            return None

        try:
            session = Session.objects.filter(session_key=session_key).first()
            if session:
                data = session.get_decoded()
                user_id = data.get("_auth_user_id")
                if user_id:
                    User = get_user_model()
                    user = User.objects.filter(pk=user_id).first()
                    if user and user.is_active:
                        return (user, session_key)
        except Exception:
            pass

        return None


class BearerSessionMiddleware:
    """
    Django middleware to also populate request.user on standard Django views (like auth_me)
    when Authorization Bearer session key is supplied.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not getattr(request, "user", None) or not request.user.is_authenticated:
            auth_header = request.META.get("HTTP_AUTHORIZATION", "")
            session_key = ""
            if auth_header.startswith("Bearer "):
                session_key = auth_header.split(" ", 1)[1].strip()
            elif "HTTP_X_SESSION_KEY" in request.META:
                session_key = request.META.get("HTTP_X_SESSION_KEY", "").strip()

            if session_key:
                try:
                    session = Session.objects.filter(session_key=session_key).first()
                    if session:
                        data = session.get_decoded()
                        user_id = data.get("_auth_user_id")
                        if user_id:
                            User = get_user_model()
                            user = User.objects.filter(pk=user_id).first()
                            if user and user.is_active:
                                request.user = user
                except Exception:
                    pass

        return self.get_response(request)
