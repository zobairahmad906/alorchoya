import os
import json
import logging
from datetime import timedelta
from urllib import request as url_request
from urllib.error import HTTPError, URLError
from django.utils import timezone
from .models import CourierConfig

logger = logging.getLogger(__name__)


def _http_request(url: str, method: str = "GET", headers: dict = None, data: dict = None, timeout: int = 15):
    headers = headers or {}
    req_body = None
    if data is not None:
        req_body = json.dumps(data).encode("utf-8")
        if "Content-Type" not in headers:
            headers["Content-Type"] = "application/json"
    if "Accept" not in headers:
        headers["Accept"] = "application/json"

    req = url_request.Request(url, data=req_body, headers=headers, method=method)
    try:
        with url_request.urlopen(req, timeout=timeout) as res:
            status_code = res.status
            body = res.read().decode("utf-8")
            try:
                return status_code, json.loads(body)
            except Exception:
                return status_code, body
    except HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed
    except URLError as e:
        raise Exception(f"Courier network connection error: {e.reason}")


class SteadFastCourierClient:
    def __init__(self, config: CourierConfig):
        self.config = config
        production_url = os.getenv("STEADFAST_BASE_URL", "https://portal.steadfast.com.bd/api/v1")
        sandbox_url = os.getenv("STEADFAST_SANDBOX_BASE_URL", "https://portal.steadfast.com.bd/api/v1")
        self.base_url = sandbox_url if config.is_sandbox else production_url

    def get_headers(self):
        return {
            "Api-Key": self.config.api_key,
            "Secret-Key": self.config.api_secret,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def get_balance(self):
        url = f"{self.base_url}/get_balance"
        status_code, data = _http_request(url, headers=self.get_headers(), timeout=12)
        if status_code == 200 and isinstance(data, dict) and data.get("status") == 200:
            return data
        err = data.get("message") if isinstance(data, dict) else f"SteadFast status {status_code}"
        raise Exception(err or "Failed to connect to SteadFast.")

    def create_order(self, order_data: dict):
        url = f"{self.base_url}/create_order"
        status_code, data = _http_request(url, method="POST", headers=self.get_headers(), data=order_data, timeout=15)

        if status_code in (200, 201) and isinstance(data, dict) and data.get("status") == 200:
            consignment = data.get("consignment", {})
            return {
                "success": True,
                "consignment_id": consignment.get("consignment_id") or consignment.get("id"),
                "tracking_code": consignment.get("tracking_code"),
                "status": consignment.get("status", "in_review"),
                "raw_response": data
            }

        err_msg = data.get("message", "Booking failed.") if isinstance(data, dict) else f"HTTP {status_code}: {str(data)[:200]}"
        if isinstance(data, dict) and "errors" in data:
            err_msg += f" {data['errors']}"
        raise Exception(err_msg)

    def get_tracking(self, consignment_id: str):
        url = f"{self.base_url}/status_by_cid/{consignment_id}"
        status_code, data = _http_request(url, headers=self.get_headers(), timeout=12)
        if status_code == 200 and isinstance(data, dict):
            status_val = data.get("delivery_status") or (data.get("data") or {}).get("delivery_status") or "unknown"
            return {
                "consignment_id": consignment_id,
                "delivery_status": status_val,
                "raw_data": data
            }
        raise Exception(f"Failed to fetch tracking: {data}")


class PathaoCourierClient:
    def __init__(self, config: CourierConfig):
        self.config = config
        self.base_url = "https://courier-api-sandbox.pathao.com" if config.is_sandbox else "https://api-hermes.pathao.com"

    def get_headers(self):
        token = self.get_access_token()
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def get_access_token(self):
        if self.config.access_token and self.config.token_expires_at and self.config.token_expires_at > timezone.now() + timedelta(minutes=5):
            return self.config.access_token

        url = f"{self.base_url}/aladdin/api/v1/issue-token"
        payload = {
            "client_id": self.config.client_id,
            "client_secret": self.config.client_secret,
            "username": self.config.username,
            "password": self.config.password,
            "grant_type": "password"
        }
        status_code, data = _http_request(url, method="POST", data=payload, timeout=15)

        if status_code == 200 and isinstance(data, dict) and "access_token" in data:
            self.config.access_token = data["access_token"]
            expires_in = data.get("expires_in", 432000)
            self.config.token_expires_at = timezone.now() + timedelta(seconds=expires_in)
            self.config.save(update_fields=["access_token", "token_expires_at"])
            return self.config.access_token

        err = data.get("message", "Authentication with Pathao failed.") if isinstance(data, dict) else f"HTTP {status_code}"
        raise Exception(err)

    @staticmethod
    def _location_rows(data):
        rows = data.get("data", []) if isinstance(data, dict) else []
        if isinstance(rows, dict):
            rows = rows.get("data", [])
        return rows if isinstance(rows, list) else []

    def _get_location_list(self, path):
        status_code, data = _http_request(
            f"{self.base_url}/aladdin/api/v1/{path}",
            headers=self.get_headers(),
            timeout=15,
        )
        if status_code == 200 and isinstance(data, dict) and data.get("type", "success") != "error":
            return self._location_rows(data)
        message = data.get("message") if isinstance(data, dict) else str(data)
        raise Exception(message or f"Pathao location request failed ({status_code}).")

    def get_cities(self):
        return self._get_location_list("countries/1/city-list")

    def get_zones(self, city_id):
        return self._get_location_list(f"cities/{city_id}/zone-list")

    def get_areas(self, zone_id):
        return self._get_location_list(f"zones/{zone_id}/area-list")

    def calculate_delivery_charge(self, city_id, zone_id, item_weight):
        if not self.config.store_id:
            raise Exception("Pathao Store ID is required to calculate live delivery charge.")
        payload = {
            "store_id": self.config.store_id,
            "item_type": 2,
            "delivery_type": 48,
            "item_weight": max(0.5, float(item_weight or 0.5)),
            "recipient_city": int(city_id),
            "recipient_zone": int(zone_id),
        }
        status_code, data = _http_request(
            f"{self.base_url}/aladdin/api/v1/merchant/price-plan",
            method="POST",
            headers=self.get_headers(),
            data=payload,
            timeout=15,
        )
        if status_code != 200 or not isinstance(data, dict) or data.get("type") == "error":
            message = data.get("message") if isinstance(data, dict) else str(data)
            raise Exception(message or f"Pathao price request failed ({status_code}).")

        candidates = ("delivery_fee", "delivery_charge", "charge", "price", "amount", "cost")
        def find_amount(value):
            if isinstance(value, (int, float)):
                return float(value)
            if isinstance(value, dict):
                for key in candidates:
                    if key in value and isinstance(value[key], (int, float, str)):
                        try:
                            return float(value[key])
                        except (TypeError, ValueError):
                            pass
                for child in value.values():
                    amount = find_amount(child)
                    if amount is not None:
                        return amount
            elif isinstance(value, list):
                for child in value:
                    amount = find_amount(child)
                    if amount is not None:
                        return amount
            return None

        amount = find_amount(data.get("data", data))
        if amount is None:
            raise Exception("Pathao returned a response without a delivery charge. Check the merchant price-plan response format.")
        return round(amount, 2), data

    def create_order(self, order_data: dict):
        url = f"{self.base_url}/aladdin/api/v1/orders"
        status_code, data = _http_request(url, method="POST", headers=self.get_headers(), data=order_data, timeout=15)

        if status_code in (200, 201) and isinstance(data, dict) and "data" in data:
            consignment = data["data"]
            return {
                "success": True,
                "consignment_id": consignment.get("consignment_id"),
                "tracking_code": consignment.get("merchant_order_id") or consignment.get("consignment_id"),
                "status": consignment.get("order_status", "pending"),
                "raw_response": data
            }

        err_msg = data.get("message", "Pathao booking failed.") if isinstance(data, dict) else f"HTTP {status_code}: {str(data)[:200]}"
        if isinstance(data, dict) and "errors" in data:
            err_msg += f" {data['errors']}"
        raise Exception(err_msg)

    def get_tracking(self, consignment_id: str):
        url = f"{self.base_url}/aladdin/api/v1/orders/{consignment_id}/info"
        status_code, data = _http_request(url, headers=self.get_headers(), timeout=12)
        if status_code == 200 and isinstance(data, dict):
            c_data = data.get("data", {})
            return {
                "consignment_id": consignment_id,
                "delivery_status": c_data.get("order_status", "unknown"),
                "raw_data": data
            }
        raise Exception(f"Failed to fetch tracking: {data}")
