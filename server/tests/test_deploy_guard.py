"""Proteções que impedem o conteúdo local do painel (server/data) de chegar à produção."""
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _lines(name: str) -> list[str]:
    return [line.strip() for line in (ROOT / name).read_text(encoding='utf-8').splitlines()]


def test_gitignore_keeps_local_panel_data_out():
    lines = _lines('.gitignore')
    assert 'server/data/' in lines
    assert '.env.painel' in lines


def test_dockerignore_keeps_local_panel_data_out():
    lines = _lines('.dockerignore')
    assert 'server/data' in lines
    assert '.env*' in lines


def test_nothing_from_server_data_is_tracked():
    tracked = subprocess.run(['git', 'ls-files', 'server/data'], cwd=ROOT, capture_output=True, text=True, check=True)
    assert tracked.stdout.strip() == ''


def test_panel_image_only_copies_code():
    copies = [line for line in _lines('server/Dockerfile') if line.startswith('COPY ') and '--from=' not in line]
    sources = [part for line in copies for part in line.split()[1:-1]]
    assert all(not s.startswith('server/data') for s in sources)
    assert 'server' not in sources and '.' not in sources


def test_deploy_script_ships_only_commits_and_checks_the_package():
    script = (ROOT / 'scripts' / 'deploy.sh').read_text(encoding='utf-8')
    assert 'git -c core.autocrlf=false archive' in script
    assert 'gh run list --repo "$REPO" --workflow ci.yml' in script  # só publica commit com CI verde
    forbidden = re.search(r"^FORBIDDEN='(.+)'$", script, re.M).group(1)
    for path in ('server/data/painel.db', 'server/data/public/site.json', 'server/data/secret.key', '.env.painel', 'QA/x.md'):
        assert re.search(forbidden, path), path
    for path in ('server/painel/app.py', 'server/painel/data/cms-defaults.json', 'src/cms/schema.ts', 'docker-compose.yml'):
        assert not re.search(forbidden, path), path
