from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])
cors = CORS()


def init_extensions(app):
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    allowed_origins = [
        origin.strip() for origin in app.config.get("CORS_ORIGINS", "").split(",") if origin.strip()
    ]
    cors.init_app(
        app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True
    )
