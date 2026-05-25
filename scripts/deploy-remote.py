#!/usr/bin/env python3
"""Deploy bundle to CT via SSH (root). Set CT_HOST / CT_PASSWORD in .env.deploy."""
from __future__ import annotations

import os
import sys
import tarfile
import tempfile
from pathlib import Path

try:
    import paramiko
except ImportError:
    print("Install paramiko: pip install paramiko", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
BUNDLE_ITEMS = ("build", "package.json", "package-lock.json", "scripts", "deploy")


def load_deploy_env() -> dict[str, str]:
    env_file = ROOT / ".env.deploy"
    out: dict[str, str] = {}
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip().strip('"').strip("'")
    out.setdefault("CT_HOST", os.environ.get("CT_HOST", "192.168.1.188"))
    out.setdefault("CT_USER", os.environ.get("CT_USER", "root"))
    out["CT_PASSWORD"] = out.get("CT_PASSWORD") or os.environ.get("CT_PASSWORD", "")
    return out


def make_bundle(path: Path) -> None:
    with tarfile.open(path, "w:gz") as tar:
        for name in BUNDLE_ITEMS:
            src = ROOT / name
            if src.exists():
                tar.add(src, arcname=f"gestione-buoni-pasto/{name}")


def main() -> int:
    cfg = load_deploy_env()
    password = cfg["CT_PASSWORD"]
    if not password:
        print("Set CT_PASSWORD in .env.deploy (see .env.deploy.example)", file=sys.stderr)
        return 1

    if not (ROOT / "build" / "index.js").exists():
        print("Run: npm run build", file=sys.stderr)
        return 1

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        cfg["CT_HOST"],
        username=cfg["CT_USER"],
        password=password,
        timeout=30,
    )

    with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as tmp:
        bundle = Path(tmp.name)
    make_bundle(bundle)

    sftp = client.open_sftp()
    remote_tar = "/tmp/deploy-bundle.tar.gz"
    sftp.put(str(bundle), remote_tar)
    sftp.close()
    bundle.unlink(missing_ok=True)

    cmd = (
        "set -euo pipefail; "
        "rm -rf /opt/gestione-buoni-pasto && mkdir -p /opt && "
        "tar xzf /tmp/deploy-bundle.tar.gz -C /opt && "
        "chmod +x /opt/gestione-buoni-pasto/scripts/provision-ct.sh && "
        "bash /opt/gestione-buoni-pasto/scripts/provision-ct.sh --app-only"
    )
    stdin, stdout, stderr = client.exec_command(cmd, timeout=600)
    exit_code = stdout.channel.recv_exit_status()
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err:
        print(err, file=sys.stderr)
    client.close()
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
