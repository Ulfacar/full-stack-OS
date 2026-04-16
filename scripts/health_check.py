#!/usr/bin/env python3
"""
Ex-Machina Health Check — monitors API and frontend availability.

Usage:
    python health_check.py                    # Check all default URLs
    python health_check.py https://custom.url # Check specific URLs

Deploy on VPS:
    cp health_check.py /root/exmachina_monitor/
    crontab -e
    */5 * * * * python3 /root/exmachina_monitor/health_check.py >> /var/log/exmachina_health.log 2>&1
"""

import sys
import urllib.request
import urllib.error
from datetime import datetime

DEFAULT_URLS = [
    "https://exmachina-api.up.railway.app/docs",
    "https://exmachina.up.railway.app",
]


def check(url: str) -> tuple[str, bool]:
    """Check URL, return (status_message, is_ok)."""
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Ex-Machina Health Checker/1.0"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            code = resp.getcode()
            if code == 200:
                return f"OK ({code})", True
            return f"WARN (HTTP {code})", False
    except urllib.error.HTTPError as e:
        return f"ERROR (HTTP {e.code})", False
    except urllib.error.URLError as e:
        return f"DOWN ({e.reason})", False
    except Exception as e:
        return f"FAIL ({e})", False


def main():
    urls = sys.argv[1:] if len(sys.argv) > 1 else DEFAULT_URLS
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    all_ok = True

    print(f"[{now}] Health check:")
    for url in urls:
        status, ok = check(url)
        marker = "✓" if ok else "✗"
        print(f"  {marker} {url} — {status}")
        if not ok:
            all_ok = False

    if not all_ok:
        print(f"  ⚠ ALERT: One or more services are down!")
        sys.exit(1)


if __name__ == "__main__":
    main()
