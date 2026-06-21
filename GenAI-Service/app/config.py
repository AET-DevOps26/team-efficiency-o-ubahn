from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    provider: Literal["cloud", "local"] = Field("cloud", validation_alias="GENAI_PROVIDER")

    logos_api_key: str = Field("lg-replace-me", validation_alias="LOGOS_API_KEY")
    logos_base_url: str = Field("https://logos.aet.cit.tum.de/v1", validation_alias="LOGOS_BASE_URL")
    logos_model: str = Field("openai/gpt-oss-120b", validation_alias="LOGOS_MODEL")

    local_base_url: str = Field("http://localhost:11434/v1", validation_alias="LOCAL_BASE_URL")
    local_model: str = Field("llama3", validation_alias="LOCAL_MODEL")
    local_api_key: str = Field("not-needed", validation_alias="LOCAL_API_KEY")

    temperature: float = Field(0.7, validation_alias="GENAI_TEMPERATURE")
    request_timeout: int = Field(60, validation_alias="GENAI_REQUEST_TIMEOUT")

    port: int = Field(8084, validation_alias="GENAI_PORT")

    @property
    def base_url(self) -> str:
        return self.logos_base_url if self.provider == "cloud" else self.local_base_url

    @property
    def api_key(self) -> str:
        return self.logos_api_key if self.provider == "cloud" else self.local_api_key

    @property
    def model(self) -> str:
        return self.logos_model if self.provider == "cloud" else self.local_model


@lru_cache
def get_settings() -> Settings:
    return Settings()
