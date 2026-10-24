#!/usr/bin/env python3
"""Clip Studio - AI-Powered Video Clipping Application
Entry point for the packaged .exe application.

Starts the FastAPI backend (uvicorn) in-process on localhost:8000
and opens the desktop frontend in a native WebView2 window.
"""

import sys
import os
import threading
import time
import urllib.request
from pathlib import Path

import uvicorn
import webview


def get_base_path() -> Path:
    """Return the base directory of the bundled application."""
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS)
    return Path(__file__).resolve().parent


def start_server(base_path: Path) -> None:
    """Start the uvicorn/FastAPI server in-process in a background thread."""
    os.chdir(str(base_path))
    sys.path.insert(0, str(base_path))
    sys.path.insert(0, str(base_path / 'api'))

    uvicorn.run(
        "api.main:app",
        host="127.0.0.1",
        port=8000,
        log_level="error",
        access_log=False,
    )


def wait_for_server(timeout: float = 30.0) -> bool:
    """Poll the health endpoint until the API is ready."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=1)
            return True
        except Exception:
            time.sleep(0.2)
    return False


def main() -> None:
    base_path = get_base_path()

    # Start uvicorn server in a daemon thread (NOT a subprocess —
    # sys.executable in a PyInstaller bundle is the .exe itself,
    # which would cause an infinite launch loop if spawned as a subprocess)
    server_thread = threading.Thread(
        target=start_server, args=(base_path,), daemon=True
    )
    server_thread.start()

    # Wait for the API to become available
    if not wait_for_server():
        print("ERROR: FastAPI backend failed to start within 30 seconds",
              file=sys.stderr)
        sys.exit(1)

    # Locate the frontend HTML file
    html_path = base_path / "index.html"
    if not html_path.exists():
        print(f"ERROR: Frontend not found at {html_path}", file=sys.stderr)
        sys.exit(1)

    # Open the native desktop window
    webview.create_window(
        title="Clip Studio — AI Video Clipping",
        url=html_path.resolve().as_uri(),
        width=1440,
        height=900,
        min_size=(1024, 768),
        resizable=True,
    )
    webview.start()


if __name__ == "__main__":
    main()
