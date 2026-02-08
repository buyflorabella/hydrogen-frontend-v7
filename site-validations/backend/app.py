"""Flask Web UI for the Site Validations Toolkit."""

import json
import os
from datetime import datetime

from flask import (
    Flask,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    send_from_directory,
    session,
    url_for,
)
from flask_socketio import SocketIO

from auth import login_required, verify_credentials
from config import (
    CONFIG_FILE,
    DEBUG,
    HOST,
    OUTPUT_DIR,
    PORT,
    SECRET_KEY,
    VALID_COMMANDS,
)
from executor import ScriptExecutor

app = Flask(__name__)
app.secret_key = SECRET_KEY

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")
executor = ScriptExecutor()


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

@app.route("/login", methods=["GET", "POST"])
def login():
    if session.get("logged_in"):
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        username = request.form.get("username", "")
        password = request.form.get("password", "")
        if verify_credentials(username, password):
            session["logged_in"] = True
            session["username"] = username
            flash("Logged in successfully.", "success")
            return redirect(url_for("dashboard"))
        else:
            flash("Invalid credentials.", "danger")

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    flash("Logged out.", "info")
    return redirect(url_for("login"))


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@app.route("/")
@login_required
def dashboard():
    # Read default URL from config
    default_url = _get_config_value("DEFAULT_URL", "")
    result_files = _list_output_files()
    return render_template(
        "dashboard.html",
        commands=VALID_COMMANDS,
        default_url=default_url,
        result_files=result_files,
        running=executor.is_running,
        current_command=executor.current_command,
    )


# ---------------------------------------------------------------------------
# Results
# ---------------------------------------------------------------------------

@app.route("/results/<filename>")
@login_required
def view_result(filename):
    safe_name = os.path.basename(filename)
    filepath = os.path.join(OUTPUT_DIR, safe_name)

    if not os.path.isfile(filepath):
        flash(f"File not found: {safe_name}", "danger")
        return redirect(url_for("dashboard"))

    with open(filepath, "r", errors="replace") as f:
        content = f.read()

    if safe_name.endswith(".json"):
        try:
            data = json.loads(content)
            return render_template("results/json_report.html",
                                   filename=safe_name, data=data,
                                   raw_json=json.dumps(data, indent=2))
        except json.JSONDecodeError:
            pass

    return render_template("results/text_output.html",
                           filename=safe_name, content=content)


@app.route("/results-list")
@login_required
def results_list():
    return jsonify(_list_output_files())


@app.route("/results/<filename>/raw")
@login_required
def download_result(filename):
    safe_name = os.path.basename(filename)
    return send_from_directory(OUTPUT_DIR, safe_name, as_attachment=True)


@app.route("/clean", methods=["POST"])
@login_required
def clean_output():
    if not os.path.isdir(OUTPUT_DIR):
        return jsonify({"removed": 0})
    count = 0
    for name in os.listdir(OUTPUT_DIR):
        filepath = os.path.join(OUTPUT_DIR, name)
        if os.path.isfile(filepath):
            os.remove(filepath)
            count += 1
    return jsonify({"removed": count})


# ---------------------------------------------------------------------------
# Config editor
# ---------------------------------------------------------------------------

@app.route("/config", methods=["GET", "POST"])
@login_required
def config_editor():
    if request.method == "POST":
        new_values = {}
        for key in request.form:
            if key.startswith("cfg_"):
                config_key = key[4:]  # strip "cfg_" prefix
                new_values[config_key] = request.form[key]

        if new_values:
            _update_config_file(new_values)
            flash("Configuration saved.", "success")
        return redirect(url_for("config_editor"))

    config_lines = _read_config_lines()
    return render_template("config_editor.html", config_lines=config_lines)


# ---------------------------------------------------------------------------
# Status endpoint (AJAX)
# ---------------------------------------------------------------------------

@app.route("/status")
@login_required
def status():
    return jsonify({
        "running": executor.is_running,
        "current_command": executor.current_command,
    })


# ---------------------------------------------------------------------------
# SocketIO event handlers
# ---------------------------------------------------------------------------

@socketio.on("run_command")
def handle_run_command(data):
    if not session.get("logged_in"):
        socketio.emit("command_error", {"error": "Not authenticated."})
        return

    command = data.get("command", "").strip()
    url = data.get("url", "").strip()
    options = []

    if data.get("verbose"):
        options.append("--verbose")
    if data.get("save") and command == "html":
        options.append("--save")
    if data.get("page_url") and command == "analytics":
        options.extend(["--page", data["page_url"]])

    if not command:
        socketio.emit("command_error", {"error": "No command specified."})
        return

    # URL is optional — the script falls back to DEFAULT_URL from config
    executor.run(command, url, socketio, options=options if options else None)


# ---------------------------------------------------------------------------
# Config helpers
# ---------------------------------------------------------------------------

def _get_config_value(key, default=""):
    """Read a single value from thresholds.conf."""
    if not os.path.isfile(CONFIG_FILE):
        return default
    with open(CONFIG_FILE, "r") as f:
        for line in f:
            stripped = line.strip()
            if stripped.startswith("#") or "=" not in stripped:
                continue
            k, v = stripped.split("=", 1)
            if k.strip() == key:
                # Strip inline comments
                v = v.split("#")[0].strip()
                return v.strip('"').strip("'")
    return default


def _read_config_lines():
    """Read thresholds.conf and return structured list of lines."""
    lines = []
    if not os.path.isfile(CONFIG_FILE):
        return lines

    with open(CONFIG_FILE, "r") as f:
        for line in f:
            raw = line.rstrip("\n")
            stripped = raw.strip()

            if not stripped or stripped.startswith("#"):
                lines.append({"type": "comment", "raw": raw})
            elif "=" in stripped:
                key, value = stripped.split("=", 1)
                # Check for inline comment
                comment = ""
                if "#" in value:
                    value, comment = value.rsplit("#", 1)
                    comment = comment.strip()
                lines.append({
                    "type": "setting",
                    "key": key.strip(),
                    "value": value.strip(),
                    "comment": comment,
                    "raw": raw,
                })
            else:
                lines.append({"type": "comment", "raw": raw})

    return lines


def _update_config_file(new_values):
    """Update thresholds.conf, preserving comments and structure."""
    if not os.path.isfile(CONFIG_FILE):
        return

    with open(CONFIG_FILE, "r") as f:
        original_lines = f.readlines()

    updated_lines = []
    for line in original_lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#") and "=" in stripped:
            key = stripped.split("=", 1)[0].strip()
            if key in new_values:
                # Preserve inline comment if present
                comment_part = ""
                if "#" in stripped.split("=", 1)[1]:
                    _, comment_part = stripped.split("=", 1)[1].rsplit("#", 1)
                    comment_part = "    # " + comment_part.strip()
                updated_lines.append(f"{key}={new_values[key]}{comment_part}\n")
                continue
        updated_lines.append(line)

    with open(CONFIG_FILE, "w") as f:
        f.writelines(updated_lines)


def _list_output_files():
    """List files in the output directory, sorted newest first."""
    files = []
    if not os.path.isdir(OUTPUT_DIR):
        return files

    for name in os.listdir(OUTPUT_DIR):
        filepath = os.path.join(OUTPUT_DIR, name)
        if os.path.isfile(filepath):
            stat = os.stat(filepath)
            files.append({
                "name": name,
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).strftime(
                    "%Y-%m-%d %H:%M:%S"
                ),
                "is_json": name.endswith(".json"),
            })

    files.sort(key=lambda x: x["modified"], reverse=True)
    return files


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Site Validations Web UI starting on http://{HOST}:{PORT}")
    print(f"Login: admin / validator2026 (change via VALIDATOR_USERNAME/PASSWORD env vars)")
    socketio.run(app, host=HOST, port=PORT, debug=DEBUG, allow_unsafe_werkzeug=True)
