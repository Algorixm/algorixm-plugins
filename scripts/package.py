#!/usr/bin/env python3
"""Validate the portable bundle and build a reproducible ZIP. No credentials/network."""
import hashlib
import json
from pathlib import Path
import re
import struct
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PLUGIN = ROOT / "plugins" / "algorixm"


def require(condition, message):
    if not condition:
        raise SystemExit(message)


def load(relative):
    return json.loads((PLUGIN / relative).read_text())


def asset(relative):
    require(relative.startswith("./"), f"Asset must start with ./: {relative}")
    path = PLUGIN / relative
    require(path.resolve().is_relative_to(PLUGIN.resolve()), f"Path escapes package: {relative}")
    require(path.is_file() and not path.is_symlink(), f"Missing or linked asset: {relative}")
    return path


def main():
    manifest = load("plugin.json")
    claude = load(".claude-plugin/plugin.json")
    require(manifest["name"] == claude["name"] == "algorixm", "Plugin names differ")
    require(manifest["version"] == claude["version"], "Plugin versions differ")
    require(re.fullmatch(r"\d+\.\d+\.\d+", manifest["version"]), "Invalid release version")
    require("hooks" not in claude, "Review bundle must not contain approval hooks")
    portable = load("mcp.json")["mcpServers"]
    legacy = load(".mcp.json")["mcpServers"]
    require(set(portable) == set(legacy) == {"algorixm"}, "Expected one MCP server")
    require(portable["algorixm"]["url"] == legacy["algorixm"]["url"] == "https://algorixm.com/mcp", "MCP endpoint mismatch")
    require(portable["algorixm"]["type"] == "streamable-http" and legacy["algorixm"]["type"] == "http", "Wrong host transport")
    require(not portable["algorixm"].get("headers") and not legacy["algorixm"].get("headers"), "No embedded authentication headers")
    auth = portable["algorixm"]["extensions"]["com.openai"]["auth"]
    require(auth["type"] == "oauth" and auth["client"] == {"mode": "dcr"}, "Expected OAuth DCR without credentials")
    extension = manifest["extensions"]["com.openai"]
    interface = extension["interface"]
    for key, limit in [("displayName", 30), ("shortDescription", 30), ("longDescription", 4000), ("developerName", 80)]:
        require(0 < len(interface[key]) <= limit, f"Invalid listing {key}")
    for key in ["websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL"]:
        require(interface[key].startswith("https://algorixm.com"), f"Invalid listing URL: {key}")
    prompts = interface["defaultPrompt"]
    require(1 <= len(prompts) <= 3 and all(0 < len(p) <= 128 for p in prompts), "Invalid starter prompts")
    for key in ["logo", "composerIcon"]:
        data = asset(interface[key]).read_bytes()
        require(data[:8] == b"\x89PNG\r\n\x1a\n", f"Expected PNG: {key}")
        width, height = struct.unpack(">II", data[16:24])
        require(48 <= width == height <= 4096 and len(data) <= 5 * 1024 * 1024, f"Invalid icon: {key}")
    for screenshot in interface.get("screenshots", []):
        asset(screenshot)
    cases = extension["review"]["test_cases"]
    require(cases == json.loads((ROOT / "review/test-cases.json").read_text()), "Review cases differ from manifest")
    require(len(cases["positive"]) == 5 and len(cases["negative"]) == 3, "Expected five positive and three negative cases")
    for case in cases["positive"] + cases["negative"]:
        require(all(case.get(key) for key in ["description", "prompt", "tools_triggered", "expected_behavior"]), "Incomplete review case")
    for required in ["README.md", "README.ko.md", "LICENSE", "skills/algorixm/SKILL.md", "skills/algorixm/references/video.md"]:
        asset("./" + required)
    require(len((PLUGIN / "README.md").read_text().split()) >= 40, "README too short")
    files = sorted(path for path in PLUGIN.rglob("*") if path.is_file())
    require(len(files) <= 512, "Too many bundled files")
    for path in PLUGIN.rglob("*"):
        require(not path.is_symlink(), f"Symlink in package: {path}")
    for path in files:
        require(path.name not in {".DS_Store", "Thumbs.db", "desktop.ini"}, f"System file: {path}")
        require(path.stat().st_size < 5 * 1024 * 1024, f"File too large: {path}")
    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    target = dist / f"algorixm-{manifest['version']}.zip"
    with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            info = zipfile.ZipInfo(path.relative_to(PLUGIN).as_posix(), (2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, path.read_bytes())
    with zipfile.ZipFile(target) as archive:
        require(archive.testzip() is None, "ZIP verification failed")
        require("plugin.json" in archive.namelist() and "mcp.json" in archive.namelist(), "Missing root manifests")
    checksum = hashlib.sha256(target.read_bytes()).hexdigest()
    target.with_suffix(".zip.sha256").write_text(f"{checksum}  {target.name}\n")
    print(json.dumps({"package": str(target), "files": len(files), "bytes": target.stat().st_size, "sha256": checksum, "local_validation": "passed", "demo_url_present": bool(extension["review"].get("demo_recording_url")), "portal_review": "not_verified"}, indent=2))


if __name__ == "__main__":
    main()
