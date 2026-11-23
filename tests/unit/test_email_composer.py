import pytest
from packages.contracts.models import ComposeEmailRequest, CandidateProfile
from services.api.engine.email.mail_manager import EmailOutreachManager


@pytest.fixture
def sample_profile():
    return CandidateProfile(
        user_id="test_user",
        full_name="Meera Iyer",
        email="meera@example.com",
        phone="+91-9876543210",
        location="Bengaluru",
        skills=["Python", "FastAPI"]
    )


def test_email_accounts_and_connect():
    mgr = EmailOutreachManager()
    accounts = mgr.list_accounts()
    assert len(accounts) >= 1

    # Connect Outlook account
    connected = mgr.connect_account(
        email_address="meera.work@outlook.com",
        provider="outlook"
    )
    assert connected.email_address == "meera.work@outlook.com"
    assert connected.provider == "outlook"
    assert connected.status == "CONNECTED"


def test_compose_and_send_email(sample_profile):
    mgr = EmailOutreachManager()
    req = ComposeEmailRequest(
        from_email="meera.work@outlook.com",
        to_email="recruiter@stripe.com",
        subject="Senior Engineer Application - Meera Iyer",
        body_text="Hi Recruiter, I built scalable microservices handling 15,000 req/s.",
        send_via_connected=True
    )
    receipt = mgr.compose_and_send(req, sample_profile)
    assert receipt.receipt_id.startswith("email_rcpt_")
    assert receipt.from_email == "meera.work@outlook.com"
    assert receipt.to_email == "recruiter@stripe.com"
    assert receipt.delivery_status == "SENT_DELIVERED"
    assert receipt.method == "CONNECTED_SMTP"
    assert len(receipt.sha256_audit_hash) == 64

    # Test mailto generation
    mailto = mgr.generate_mailto_url("recruiter@stripe.com", "Subject", "Body Text")
    assert mailto.startswith("mailto:recruiter@stripe.com?")
    assert "Subject" in mailto
