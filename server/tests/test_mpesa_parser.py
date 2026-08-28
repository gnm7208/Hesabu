from server.services.mpesa_parser import parse_mpesa_text


def test_parses_p2p_wording_with_254_phone():
    text = (
        "QAR7A1B2C3 Confirmed. You have received Ksh500.00 from JOHN KAMAU "
        "254712345678 on 3/8/26 at 2:30 PM. New M-PESA balance is Ksh12,450.00."
    )
    parsed, unparsed = parse_mpesa_text(text)
    assert unparsed == []
    assert len(parsed) == 1
    row = parsed[0]
    assert row["code"] == "QAR7A1B2C3"
    assert row["amount_cents"] == 50000
    assert row["sender_name"] == "John Kamau"
    assert row["phone"] == "254712345678"
    assert row["contributed_at"].isoformat() == "2026-08-03T14:30:00"


def test_parses_till_wording_with_leading_zero_phone():
    text = (
        "RJ45D4E5F6 Confirmed. Ksh1,000.00 received from JANE WANJIRU 0722111222 "
        "on 5/8/26 at 10:15 AM. Account Number CONTRIB. New Utility balance is Ksh45,320.00."
    )
    parsed, unparsed = parse_mpesa_text(text)
    assert unparsed == []
    assert len(parsed) == 1
    row = parsed[0]
    assert row["amount_cents"] == 100000
    assert row["phone"] == "254722111222"
    assert row["sender_name"] == "Jane Wanjiru"


def test_handles_comma_thousands_and_four_digit_year():
    text = (
        "AB12C34D56 Confirmed. You have received Ksh12,345.00 from MARY ATIENO "
        "254733222111 on 15/1/2027 at 11:59 AM. New M-PESA balance is Ksh1,000.00."
    )
    parsed, _ = parse_mpesa_text(text)
    assert parsed[0]["amount_cents"] == 1234500
    assert parsed[0]["contributed_at"].year == 2027


def test_garbage_line_is_dropped_not_flagged():
    parsed, unparsed = parse_mpesa_text("hello, just checking in about the meeting")
    assert parsed == []
    assert unparsed == []


def test_confirmed_looking_line_with_missing_phone_goes_to_unparsed():
    text = "XY99Z88W77 Confirmed. You have received Ksh500.00 from a friend on 3/8/26 at 2:30 PM."
    parsed, unparsed = parse_mpesa_text(text)
    assert parsed == []
    assert unparsed == [text]


def test_blank_lines_are_skipped():
    text = "\n\n   \n"
    parsed, unparsed = parse_mpesa_text(text)
    assert parsed == []
    assert unparsed == []


def test_multiline_input_mixes_valid_and_invalid():
    valid_1 = (
        "QAR7A1B2C3 Confirmed. You have received Ksh500.00 from JOHN KAMAU "
        "254712345678 on 3/8/26 at 2:30 PM. New M-PESA balance is Ksh12,450.00."
    )
    invalid = "Confirmed but not really a real message at all"
    valid_2 = (
        "RJ45D4E5F6 Confirmed. Ksh1,000.00 received from JANE WANJIRU 0722111222 "
        "on 5/8/26 at 10:15 AM. Account Number CONTRIB. New Utility balance is Ksh45,320.00."
    )
    text = "\n".join([valid_1, invalid, valid_2])
    parsed, unparsed = parse_mpesa_text(text)
    assert len(parsed) == 2
    assert unparsed == [invalid]
