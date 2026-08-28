from decimal import Decimal, InvalidOperation


def parse_amount_to_cents(amount_str: str) -> int:
    """'1,000.00' -> 100000. Raises ValueError on anything not a clean money string."""
    cleaned = amount_str.replace(",", "").strip()
    try:
        amount = Decimal(cleaned)
    except InvalidOperation as exc:
        raise ValueError(f"Not a valid amount: {amount_str!r}") from exc
    return int((amount * 100).to_integral_value())


def cents_to_display(cents: int) -> str:
    return f"{Decimal(cents) / 100:,.2f}"
