import os
from datetime import timedelta


class Config:
    SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "postgresql://hesabu:hesabu_password@localhost:5433/hesabu"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Neon (and any serverless Postgres) suspends its compute when idle, which kills
    # pooled connections without telling SQLAlchemy. Without pre_ping the pool hands
    # out a dead socket and the first query after an idle period dies with
    # "SSL connection has been closed unexpectedly". pre_ping costs one cheap
    # round-trip per checkout; recycle caps connection age well under Neon's timeout.
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
    }
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 900)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", 2592000))
    )
    JWT_TOKEN_LOCATION = ["cookies", "headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    JWT_COOKIE_SECURE = os.getenv("JWT_COOKIE_SECURE", "false").lower() == "true"
    JWT_COOKIE_SAMESITE = os.getenv("JWT_COOKIE_SAMESITE", "Lax")
    JWT_COOKIE_CSRF_PROTECT = os.getenv("JWT_COOKIE_CSRF_PROTECT", "true").lower() == "true"
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
    ENV = os.getenv("ENV", "development")
    PORT = int(os.getenv("PORT", 5000))
    LOG_LEVEL = os.getenv("LOG_LEVEL", "info")
    RATELIMIT_HEADERS_ENABLED = True

    SENTRY_DSN = os.getenv("SENTRY_DSN", "")


class TestingConfig(Config):
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///:memory:")
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_TOKEN_LOCATION = ["headers"]
    TESTING = True


config_by_name = {
    "development": Config,
    "staging": Config,
    "production": Config,
    "testing": TestingConfig,
}
