"""Turns raw M-PESA confirmation SMS text into structured contribution rows.

Deliberately has no knowledge of groups or members — see CLAUDE.md. One confirmation
message per line. Two real M-PESA wordings are supported (P2P "send money" and
till/paybill "buy goods"/"pay bill"):

    QAR7XXXXXX Confirmed. You have received Ksh1,000.00 from JANE DOE 254712345678
    on 3/8/26 at 2:30 PM. New M-PESA balance is Ksh12,450.00.

    RJ45XXXXXX Confirmed. Ksh1,000.00 received from JANE DOE 0722111222 on 5/8/26
    at 10:15 AM. Account Number CONTRIB. New Utility balance is Ksh45,320.00.
"""

import re
from datetime import datetime
from decimal import Decimal, InvalidOperation

from server.utils.phone import normalize_phone

_CONFIRMATION_RE = re.compile(
    r"(?P<code>[A-Z0-9]{10})\s+Confirmed\.\s*"
    r"(?:You have received\s+Ksh(?P<amount1>[\d,]+\.\d{2})\s+from"
    r"|Ksh(?P<amount2>[\d,]+\.\d{2})\s+received from)\s+"
    r"(?P<name>[A-Za-z'\.\- ]+?)\s+"
    r"(?P<phone>(?:\+?254|0)\d{9})\s+"
    r"on\s+(?P<date>\d{1,2}/\d{1,2}/\d{2,4})\s+"
    r"at\s+(?P<time>\d{1,2}:\d{2}\s?[APap][Mm])",
    re.IGNORECASE,
)

_DATE_FORMATS = ("%d/%m/%y %I:%M %p", "%d/%m/%Y %I:%M %p")


def _parse_amount_cents(raw_amount: str) -> int:
    cleaned = raw_amount.replace(",", "")
    try:
        amount = Decimal(cleaned)
    except InvalidOperation:
        return 0
    return int((amount * 100).to_integral_value())


def _parse_datetime(date_str: str, time_str: str) -> datetime | None:
    combined = f"{date_str} {time_str.upper().replace(' ', '')}"
    # normalize "2:30PM" -> "2:30 PM" so both formats above match consistently
    combined = re.sub(r"(\d)(AM|PM)$", r"\1 \2", combined)
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(combined, fmt)
        except ValueError:
            continue
    return None


def parse_mpesa_text(raw_text: str) -> tuple[list[dict], list[str]]:
    """One M-PESA confirmation SMS per line. Returns (parsed, unparsed).

    `parsed` rows: code, amount_cents, sender_name, phone (normalized 2547XXXXXXXX),
    contributed_at, raw_text. `unparsed` is the raw text of lines that look like a
    confirmation (contain "confirmed") but didn't match the expected shape, so a
    treasurer can review them by hand instead of them being silently dropped.
    """
    parsed: list[dict] = []
    unparsed: list[str] = []

    for line in raw_text.splitlines():
        line = line.strip()
        if not line:
            continue

        match = _CONFIRMATION_RE.search(line)
        if not match:
            if "confirmed" in line.lower():
                unparsed.append(line)
            continue

        amount_raw = match.group("amount1") or match.group("amount2")
        phone = normalize_phone(match.group("phone"))
        contributed_at = _parse_datetime(match.group("date"), match.group("time"))

        if phone is None or contributed_at is None:
            unparsed.append(line)
            continue

        parsed.append(
            {
                "code": match.group("code").upper(),
                "amount_cents": _parse_amount_cents(amount_raw),
                "sender_name": " ".join(match.group("name").split()).title(),
                "phone": phone,
                "contributed_at": contributed_at,
                "raw_text": line,
            }
        )

    return parsed, unparsed
