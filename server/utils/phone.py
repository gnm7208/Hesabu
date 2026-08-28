import re

_DIGITS_RE = re.compile(r"\D")


def normalize_phone(raw: str) -> str | None:
    """'0722111222' / '+254722111222' / '254722111222' -> '254722111222'.

    Kenyan mobile numbers only (07xx/01xx). Returns None if it doesn't fit that shape,
    rather than guessing — callers treat that as "couldn't normalize".
    """
    digits = _DIGITS_RE.sub("", raw)
    if digits.startswith("254") and len(digits) == 12:
        return digits
    if digits.startswith("0") and len(digits) == 10:
        return "254" + digits[1:]
    if len(digits) == 9 and digits[0] in ("7", "1"):
        return "254" + digits
    return None
