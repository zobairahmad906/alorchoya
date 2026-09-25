import json
import secrets
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings
from django.contrib.auth import get_user_model, login
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import redirect
from .models import CustomerProfile
from .serializers import CustomerProfileSerializer, CustomerAddressSerializer, CustomerOrderSerializer


def _frontend(path="/checkout"):
    return redirect(settings.PUBLIC_APP_URL.rstrip("/") + path)


def google_start(request):
    next_path = request.GET.get("next", "/checkout")
    if not next_path.startswith("/") or next_path.startswith("//"): next_path = "/checkout"
    request.session["google_oauth_next"] = next_path
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_REDIRECT_URI:
        return JsonResponse({"detail": "Google OAuth is not configured."}, status=503)
    state = secrets.token_urlsafe(32)
    request.session["google_oauth_state"] = state
    params = {"client_id": settings.GOOGLE_CLIENT_ID, "redirect_uri": settings.GOOGLE_REDIRECT_URI, "response_type": "code", "scope": "openid email profile", "state": state, "prompt": "select_account"}
    return redirect("https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params))


def google_callback(request):
    next_path = request.session.pop("google_oauth_next", "/checkout")
    if request.GET.get("error"):
        return _frontend(next_path + "?google_error=cancelled")
    state = request.GET.get("state")
    expected = request.session.pop("google_oauth_state", None)
    if not state or not expected or not secrets.compare_digest(state, expected):
        return _frontend(next_path + "?google_error=invalid_state")
    code = request.GET.get("code")
    if not code:
        return _frontend(next_path + "?google_error=missing_code")
    try:
        token_body = urlencode({"code": code, "client_id": settings.GOOGLE_CLIENT_ID, "client_secret": settings.GOOGLE_CLIENT_SECRET, "redirect_uri": settings.GOOGLE_REDIRECT_URI, "grant_type": "authorization_code"}).encode()
        token_request = Request("https://oauth2.googleapis.com/token", data=token_body, headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
        with urlopen(token_request, timeout=10) as response:
            token = json.loads(response.read().decode())
        access_token = token.get("access_token")
        if not access_token:
            raise ValueError("Google did not return an access token")
        profile_request = Request("https://openidconnect.googleapis.com/v1/userinfo", headers={"Authorization": f"Bearer {access_token}"})
        with urlopen(profile_request, timeout=10) as response:
            profile = json.loads(response.read().decode())
        email = (profile.get("email") or "").strip().lower()
        if not email or profile.get("email_verified") is not True:
            raise ValueError("Google email is not verified")
        User = get_user_model()
        user = User.objects.filter(email=email).order_by("id").first()
        created = user is None
        if created:
            user = User(username="google_" + secrets.token_hex(8), email=email, first_name=profile.get("given_name", "")[:150], last_name=profile.get("family_name", "")[:150])
            user.set_unusable_password(); user.save()
        login(request, user)
        profile_obj, _ = CustomerProfile.objects.get_or_create(user=user)
        profile_obj.google_sub = profile.get("sub", "") or profile_obj.google_sub
        profile_obj.avatar_url = profile.get("picture", "") or profile_obj.avatar_url
        profile_obj.save(update_fields=("google_sub", "avatar_url", "updated_at"))
        return _frontend(next_path + "?google=success")
    except (HTTPError, URLError, ValueError, json.JSONDecodeError):
        return _frontend(next_path + "?google_error=provider")


def auth_me(request):
    if not request.user.is_authenticated:
        return JsonResponse({"authenticated": False})
    profile, _ = CustomerProfile.objects.get_or_create(user=request.user)
    return JsonResponse({
        "authenticated": True,
        "name": request.user.get_full_name() or request.user.email,
        "email": request.user.email,
        "avatar_url": profile.avatar_url or "",
        "profile": CustomerProfileSerializer(profile).data,
        "addresses": CustomerAddressSerializer(profile.addresses.all(), many=True).data,
        "orders": CustomerOrderSerializer(request.user.customer_orders.all()[:20], many=True).data
    })


def csrf_token(request):
    return JsonResponse({"csrfToken": get_token(request)})
