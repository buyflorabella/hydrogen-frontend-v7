"""Memory Garden — entrypoint."""

from app import create_app

app = create_app()

if __name__ == "__main__":
    port = app.config["PORT"]
    debug = app.config["DEV_MODE"]
    print(f"Memory Garden starting on :{port} (dev_mode={debug})")
    app.run(host="0.0.0.0", port=port, debug=debug)
