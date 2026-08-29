from flask import current_app, jsonify, request


def server_error(exc):
    """Generic 500 for unexpected exceptions.

    Never return str(exc) to the client: SQLAlchemy errors embed the failing SQL,
    column names and bound parameters (including user email addresses), which is
    both an information leak and meaningless to the user. Log the full traceback
    server-side instead, and keep the detail in non-production for debugging.
    """
    current_app.logger.exception("Unhandled error on %s %s", request.method, request.path)
    payload = {"error": "server_error", "message": "An unexpected error occurred."}
    if current_app.config.get("ENV") != "production":
        payload["detail"] = str(exc)
    return jsonify(payload), 500


class APIError(Exception):
    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload or {}

    def to_dict(self):
        rv = dict(self.payload)
        rv["error"] = self.message
        return rv


class NotFoundError(APIError):
    def __init__(self, message="Not found", payload=None):
        super().__init__(message, status_code=404, payload=payload)


class ForbiddenError(APIError):
    def __init__(self, message="Forbidden", payload=None):
        super().__init__(message, status_code=403, payload=payload)


def register_error_handlers(app):
    @app.errorhandler(APIError)
    def handle_api_error(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(400)
    @app.errorhandler(401)
    @app.errorhandler(403)
    @app.errorhandler(404)
    @app.errorhandler(409)
    @app.errorhandler(422)
    @app.errorhandler(500)
    def handle_http_error(error):
        return jsonify(
            {"error": error.name.lower(), "message": error.description or str(error)}
        ), error.code
