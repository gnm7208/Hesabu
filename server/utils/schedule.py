from datetime import datetime


def periods_elapsed(start: datetime, end: datetime, frequency: str) -> int:
    """How many contribution periods (weekly/monthly) fall within [start, end], at least 1
    once `start` has passed. Shared by arrears and statement generation so both agree on
    what "one period" means for a given group's schedule.
    """
    if end < start:
        return 0
    if frequency == "weekly":
        return ((end - start).days // 7) + 1
    months = (end.year - start.year) * 12 + (end.month - start.month) + 1
    return max(months, 1)
