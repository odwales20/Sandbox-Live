import json
import os
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
build = "-".join(os.environ[key] for key in ("GITHUB_SHA", "GITHUB_RUN_ID", "GITHUB_RUN_ATTEMPT"))
if not re.fullmatch(r"[a-f0-9]{40}-\d+-\d+", build):
    raise ValueError("Invalid GitHub Pages build identifier")

html_asset = re.compile(r'(\b(?:src|href)=")((?:\.\.?/)*[\w/-]+\.(?:js|css))(?:\?v=\d+)?(")')
js_import = re.compile(r"""(\bfrom\s+['"])(\.{1,2}/[\w/-]+\.js)(?:\?v=\d+)?(['"])""")

def version_assets(file, pattern):
    source = file.read_text(encoding="utf-8")
    file.write_text(
        pattern.sub(lambda match: f"{match[1]}{match[2]}?v={build}{match[3]}", source),
        encoding="utf-8",
    )

for directory in (root, root / "control", root / "tv1", root / "tv2"):
    version_assets(directory / "index.html", html_asset)
    for module in directory.glob("*.js"):
        version_assets(module, js_import)

(root / "build.json").write_text(json.dumps({"build": build}) + "\n", encoding="utf-8")
