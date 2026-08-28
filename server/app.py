import os

from flask import Flask, jsonify
from werkzeug.middleware.proxy_fix import ProxyFix

from server.config import config_by_name
from server.extensions import db, init_extensions
from server.utils.errors import register_error_handlers


def create_app():
    app = Flask(__name__)
    env = os.getenv("ENV", "development")
    app.config.from_object(config_by_name[env])

    if env == "production":
        app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

    init_extensions(app)
    register_error_handlers(app)

    from server.routes.auth import bp as auth_bp
    from server.routes.contributions import bp as contributions_bp
    from server.routes.groups import bp as groups_bp
    from server.routes.members import bp as members_bp
    from server.routes.statements import bp as statements_bp

    app.register_blueprint(auth_bp, url_prefix="/api/v1")
    app.register_blueprint(groups_bp, url_prefix="/api/v1")
    app.register_blueprint(members_bp, url_prefix="/api/v1")
    app.register_blueprint(contributions_bp, url_prefix="/api/v1")
    app.register_blueprint(statements_bp, url_prefix="/api/v1")

    @app.get("/api/health")
    def health():
        try:
            db.session.execute(db.text("SELECT 1"))
            db_status = "ok"
        except Exception:
            db_status = "error"
        return jsonify({"status": "ok", "database": db_status, "env": env})

    if app.config.get("SENTRY_DSN"):
        import sentry_sdk
        from sentry_sdk.integrations.flask import FlaskIntegration

        sentry_sdk.init(
            dsn=app.config["SENTRY_DSN"], integrations=[FlaskIntegration()], environment=env
        )

    return app
