import pytest
from fastapi import HTTPException
from routes.url_analyzer import AnalyzeRequest, analyze_url, verify_url


@pytest.mark.parametrize("unsafe", [
    "http://example.com", "file:///etc/passwd", "https://localhost",
    "https://127.0.0.1", "https://169.254.169.254/latest/meta-data",
    "https://example.com:8443", "https://example.com@127.0.0.1",
    "https://example.com:invalid", "https://example.com\\@attacker.com",
    "https://example.org",
])
def test_disallow_unapproved_or_unsafe_url(unsafe, monkeypatch):
    monkeypatch.setenv("ANALYZER_ALLOWED_HOSTS", "example.com")
    with pytest.raises(ValueError):
        verify_url(unsafe)


def test_allow_approved_https_url(monkeypatch):
    monkeypatch.setenv("ANALYZER_ALLOWED_HOSTS", "example.com")
    assert verify_url("https://example.com/") == "https://example.com/"


@pytest.mark.asyncio
async def test_invalid_device_is_rejected_before_browser():
    with pytest.raises(HTTPException) as error:
        await analyze_url(AnalyzeRequest(url="https://example.com", device="tablet"))
    assert error.value.status_code == 422


@pytest.mark.parametrize("url", [
    "https://www.alhashmyahh.com/",
    "https://alhashmyahh.com/",
])
def test_approved_owned_website(url, monkeypatch):
    monkeypatch.setenv(
        "ANALYZER_ALLOWED_HOSTS",
        "example.com,www.alhashmyahh.com,alhashmyahh.com",
    )
    assert verify_url(url) == url


def test_owned_site_is_not_allowed_without_explicit_config(monkeypatch):
    monkeypatch.delenv("ANALYZER_ALLOWED_HOSTS", raising=False)
    with pytest.raises(ValueError):
        verify_url("https://www.alhashmyahh.com/")
