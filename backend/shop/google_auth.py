import json
import secrets
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings
from django.contrib.auth import get_user_model, login
from django.core import signing
from django.db.models import Q
from django.http import JsonResponse, HttpResponse
from django.middleware.csrf import get_token
from django.shortcuts import redirect
import re
from .models import CustomerProfile, Order
from .serializers import CustomerProfileSerializer, CustomerAddressSerializer, CustomerOrderSerializer


def _frontend(path="/account"):
    return redirect(settings.PUBLIC_APP_URL.rstrip("/") + path)


def _redirect_destination(dest):
    if (
        dest.startswith("alorchoya://")
        or dest.startswith("exp://")
        or dest.startswith("exps://")
    ):
        html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Redirecting to app...</title></head>
<body>
<p style="font-family:sans-serif;text-align:center;margin-top:40px;color:#10b981;font-weight:bold;">লগইন সম্পন্ন হয়েছে, অ্যাপে ফিরে যাচ্ছে...</p>
<script>window.location.replace({json.dumps(dest)});</script>
</body>
</html>"""
        response = HttpResponse(html, status=302, content_type="text/html; charset=utf-8")
        response["Location"] = dest
        return response

    if dest.startswith("http://") or dest.startswith("https://"):
        return redirect(dest)
    return redirect(settings.PUBLIC_APP_URL.rstrip("/") + dest)


def google_start(request):
    next_path = (request.GET.get("next") or "").strip()
    valid_prefix = (
        next_path.startswith("alorchoya://")
        or next_path.startswith("exp://")
        or next_path.startswith("exps://")
        or (next_path.startswith("/") and not next_path.startswith("//"))
    )
    if not valid_prefix:
        next_path = "/account"

    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_REDIRECT_URI:
        return JsonResponse({"detail": "Google OAuth is not configured."}, status=503)

    state_payload = {
        "token": secrets.token_urlsafe(16),
        "next": next_path
    }
    state = signing.dumps(state_payload)
    request.session["google_oauth_state"] = state
    request.session["google_oauth_next"] = next_path

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account"
    }
    return redirect("https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params))


def google_callback(request):
    state = request.GET.get("state", "")
    next_path = "/account"

    # Decode next_path from cryptographically signed state
    state_valid = False
    if state:
        try:
            state_payload = signing.loads(state, max_age=600)
            next_path = state_payload.get("next") or "/account"
            state_valid = True
        except Exception:
            pass

    if not state_valid:
        # Fallback to session state if available
        expected = request.session.pop("google_oauth_state", None)
        next_path = request.session.pop("google_oauth_next", "/account")
        if state and expected and secrets.compare_digest(state, expected):
            state_valid = True

    sep = "&" if "?" in next_path else "?"

    if request.GET.get("error"):
        return _redirect_destination(f"{next_path}{sep}google_error=cancelled")

    if not state_valid:
        return _redirect_destination(f"{next_path}{sep}google_error=invalid_state")

    code = request.GET.get("code")
    if not code:
        return _redirect_destination(f"{next_path}{sep}google_error=missing_code")

    try:
        token_body = urlencode({
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }).encode()
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
            user = User(
                username="google_" + secrets.token_hex(8),
                email=email,
                first_name=profile.get("given_name", "")[:150],
                last_name=profile.get("family_name", "")[:150]
            )
            user.set_unusable_password()
            user.save()
        login(request, user)
        profile_obj, _ = CustomerProfile.objects.get_or_create(user=user)
        profile_obj.google_sub = profile.get("sub", "") or profile_obj.google_sub
        profile_obj.avatar_url = profile.get("picture", "") or profile_obj.avatar_url
        profile_obj.save(update_fields=("google_sub", "avatar_url", "updated_at"))
        
        session_key = getattr(request.session, "session_key", "") or ""
        return _redirect_destination(f"{next_path}{sep}google=success&session_key={session_key}")
    except (HTTPError, URLError, ValueError, json.JSONDecodeError):
        return _redirect_destination(f"{next_path}{sep}google_error=provider")


def auth_me(request):
    if not request.user.is_authenticated:
        return JsonResponse({"authenticated": False})
    profile, _ = CustomerProfile.objects.get_or_create(user=request.user)

    order_query = Q(customer=request.user)
    if request.user.email:
        order_query |= Q(email__iexact=request.user.email)

    phone = getattr(profile, "phone", "") or ""
    if phone:
        clean_p = re.sub(r"\D", "", str(phone))
        if len(clean_p) >= 10:
            order_query |= Q(phone__icontains=clean_p[-10:])

    # Auto-link previously placed guest orders with this email / phone to this customer
    try:
        Order.objects.filter(order_query, customer__isnull=True).update(customer=request.user)
    except Exception:
        pass

    orders = Order.objects.filter(order_query).distinct().order_by("-id")[:30]

    return JsonResponse({
        "authenticated": True,
        "name": request.user.get_full_name() or request.user.email,
        "email": request.user.email,
        "avatar_url": profile.avatar_url or "",
        "profile": CustomerProfileSerializer(profile).data,
        "addresses": CustomerAddressSerializer(profile.addresses.all(), many=True).data,
        "orders": CustomerOrderSerializer(orders, many=True).data,
        "session_key": getattr(request.session, "session_key", "") or ""
    })


def csrf_token(request):
    return JsonResponse({"csrfToken": get_token(request)})
