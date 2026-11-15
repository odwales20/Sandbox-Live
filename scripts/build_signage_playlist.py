import json
from pathlib import Path

signage = Path(__file__).resolve().parents[1] / "signage"
extensions = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
images = sorted(
    file.name for file in signage.iterdir()
    if file.is_file() and file.suffix.lower() in extensions
)
(signage / "images.json").write_text(json.dumps(images, indent=2) + "\n", encoding="utf-8")
