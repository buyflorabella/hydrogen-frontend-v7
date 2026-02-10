# Backend Architecture: Three Route Layers

## Overview

The platform-template backend serves three types of HTTP traffic from a single Flask process:

| Layer | URL Prefix | Technology | Purpose |
|-------|-----------|------------|---------|
| **REST API** | `/api/*` | flask-restx `Resource` classes | JSON endpoints for frontend consumption |
| **Swagger UI** | `/api/docs` | flask-restx built-in | Interactive API documentation + testing |
| **Pages** | `/` | Jinja2 templates | Server-rendered HTML (mirrors React frontend) |

## Why Three Layers?

1. **REST API** — the data contract between frontend and backend. Every endpoint is auto-documented via flask-restx model definitions.
2. **Swagger UI** — free from flask-restx. Lets developers validate endpoints without writing a single line of frontend code. "Try it out" button sends real requests.
3. **Jinja2 Pages** — a working HTML frontend that demonstrates the same user flows the React app will implement. Useful for prototyping, SSR fallback, and admin pages.

## Blueprint-Based API Pattern

The `Api` object is attached to a **Blueprint**, not the Flask app directly:

```python
# api/__init__.py
api_bp = Blueprint("api", __name__, url_prefix="/api")
api = Api(api_bp, doc="/docs", ...)
```

**Why this matters:** flask-restx installs its own error handlers. When `Api` is on the app, *all* 404s return JSON — even requests for HTML pages. By isolating `Api` on a blueprint:

- `GET /nonexistent` → Flask's default HTML 404
- `GET /api/nonexistent` → flask-restx JSON 404

This is critical for apps that serve both HTML and JSON.

## Directory Structure

```
backend/
├── app.py                  # App factory + module-level app
├── config.py               # Config class (env vars + restx settings)
├── requirements.txt        # Python dependencies
├── api/                    # REST API layer (flask-restx)
│   ├── __init__.py         # Blueprint + Api + namespace registration
│   └── health.py           # Health namespace (example endpoint)
├── routes/                 # Jinja2 page routes
│   ├── __init__.py         # Exports pages_bp
│   └── pages.py            # GET / and future page routes
├── templates/              # Jinja2 templates
│   ├── base.html           # Base layout (nav, blocks)
│   └── index.html          # Landing page
└── static/
    └── css/
        └── app.css         # Base styles
```

## How to Add a New API Namespace

1. Create `api/items.py`:

```python
from flask_restx import Namespace, Resource, fields

items_ns = Namespace("items", description="Item operations")

item_model = items_ns.model("Item", {
    "id": fields.Integer(description="Item ID"),
    "name": fields.String(description="Item name", required=True),
})

@items_ns.route("")
class ItemList(Resource):
    @items_ns.marshal_list_with(item_model)
    def get(self):
        """List all items"""
        return [{"id": 1, "name": "Example"}]
```

2. Register in `api/__init__.py`:

```python
from .items import items_ns
api.add_namespace(items_ns)
```

3. Visit `/api/docs` — the new namespace appears automatically.

## How to Add a New Jinja2 Page

1. Create template `templates/about.html`:

```html
{% extends "base.html" %}
{% block title %}About{% endblock %}
{% block content %}
<h1>About</h1>
<p>Page content here.</p>
{% endblock %}
```

2. Add route in `routes/pages.py`:

```python
@pages_bp.route("/about")
def about():
    return render_template("about.html")
```

3. Optionally add a nav link in `templates/base.html`.

## Backward Compatibility Contracts

These contracts must not break — existing scripts depend on them:

| Contract | Dependent Script | Implementation |
|----------|-----------------|----------------|
| `python3 app.py` starts server | `run-backend.sh` | `if __name__ == "__main__"` block |
| `app:app` is importable | `run-gunicorn.sh`, systemd service | `app = create_app()` at module level |
| `Config` class in `config.py` | `app.py` line 8 | `app.config.from_object("config.Config")` |
| `GET /api/health` returns JSON | Platform convention | `{"status":"ok","env":"..."}` |

## How Jinja2 Pages Mirror the React Frontend

The Jinja2 pages serve as a **reference implementation**:

- Each page demonstrates the same data flow (fetch from `/api/*`, render result)
- The HTML structure maps 1:1 to React component hierarchy
- When building the React frontend, developers can compare behavior against the Jinja2 version
- Pages use vanilla JS `fetch()` — no framework dependencies

## App Factory Pattern

```python
def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")
    CORS(app, resources={r"/api/*": {"origins": ...}})
    app.register_blueprint(api_bp)    # /api/*
    app.register_blueprint(pages_bp)  # /
    return app

app = create_app()  # module-level for gunicorn
```

The factory pattern enables:
- **Testing** — create fresh app instances with test config
- **Gunicorn** — `app:app` imports the module-level variable
- **CLI** — `python3 app.py` uses `__main__` block
