from app.config import Settings

# Settings fields use validation_alias (e.g. "LOGOS_API_KEY"), so pydantic-settings
# only picks up overrides from matching env vars, not from snake_case constructor kwargs.


def test_cloud_provider_uses_logos_settings(monkeypatch):
    monkeypatch.setenv("GENAI_PROVIDER", "cloud")
    monkeypatch.setenv("LOGOS_API_KEY", "lg-secret")
    monkeypatch.setenv("LOGOS_BASE_URL", "https://logos.aet.cit.tum.de/v1")
    monkeypatch.setenv("LOGOS_MODEL", "openai/gpt-oss-120b")

    settings = Settings(_env_file=None)

    assert settings.base_url == "https://logos.aet.cit.tum.de/v1"
    assert settings.api_key == "lg-secret"
    assert settings.model == "openai/gpt-oss-120b"


def test_local_provider_uses_local_settings(monkeypatch):
    monkeypatch.setenv("GENAI_PROVIDER", "local")
    monkeypatch.setenv("LOCAL_BASE_URL", "http://localhost:11434/v1")
    monkeypatch.setenv("LOCAL_MODEL", "llama3")
    monkeypatch.setenv("LOCAL_API_KEY", "not-needed")

    settings = Settings(_env_file=None)

    assert settings.base_url == "http://localhost:11434/v1"
    assert settings.api_key == "not-needed"
    assert settings.model == "llama3"


def test_defaults_to_cloud_provider(monkeypatch):
    monkeypatch.delenv("GENAI_PROVIDER", raising=False)

    settings = Settings(_env_file=None)

    assert settings.provider == "cloud"
