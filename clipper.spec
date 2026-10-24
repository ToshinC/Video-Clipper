# -*- mode: python ; coding: utf-8 -*-

import os

base = os.getcwd()

block_cipher = None

a = Analysis(
    ["launch.py"],
    pathex=[base],
    binaries=[],
    datas=[
        # Frontend assets
        (os.path.join(base, "index.html"), "."),
        (os.path.join(base, "app.js"), "."),
        (os.path.join(base, "style.css"), "."),
        (os.path.join(base, "libs"), "libs"),
        # FastAPI application
        (os.path.join(base, "api"), "api"),
        # FFmpeg binaries
        (os.path.join(base, "ffmpeg"), "ffmpeg"),
    ],
    hiddenimports=[
        "fastapi",
        "uvicorn",
        "uvicorn.protocols.http.auto",
        "uvicorn.lifespan.on",
        "starlette",
        "starlette.routing",
        "starlette.middleware",
        "starlette.middleware.cors",
        "celery",
        "redis",
        "sqlalchemy",
        "sqlalchemy.dialects.sqlite",
        "pydantic",
        "pydantic_core",
        "yt_dlp",
        "faster_whisper",
        "scenedetect",
        "scenedetect.detectors",
        "cv2",
        "av",
        "numpy",
        "ctranslate2",
        "tokenizers",
        "websockets",
        "anyio",
        "click",
        "click_plugins",
        "kombu",
        "billiard",
        "vine",
        "tzlocal",
        "python_multipart",
        "webview",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="clipper",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)

app = BUNDLE(
    exe,
    name="Clip Studio.app",
    icon=None,
    bundle_identifier="com.clipstudio.app",
)
