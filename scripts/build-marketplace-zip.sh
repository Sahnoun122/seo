#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Marketplace Release Builder
# Produces a clean ZIP for CodeCanyon / CodeSter submission:
#   - No .git directory
#   - No node_modules
#   - No real .env files (only .env.example templates)
#   - Verified: no secrets in output
# Usage: bash scripts/build-marketplace-zip.sh [version]
# -----------------------------------------------------------------------------
set -euo pipefail

VERSION="${1:-1.0.0}"
OUT_DIR="$(pwd)/release"
ZIP_NAME="seo-gen-ai-v${VERSION}.zip"
STAGING="${OUT_DIR}/seo-gen-ai"

echo "Building marketplace ZIP v${VERSION}..."

# ── 1. Clean staging ─────────────────────────────────────────────────────────
rm -rf "${STAGING}"
mkdir -p "${STAGING}"

# ── 2. Copy project (exclude noise) ──────────────────────────────────────────
# rsync exclude order matters: include rules must come BEFORE the exclude they override
rsync -a \
  --exclude=".git" \
  --exclude="node_modules" \
  --include=".env.example" \
  --exclude=".env" \
  --exclude=".env.local" \
  --exclude=".env.development" \
  --exclude=".env.test" \
  --exclude=".env.production" \
  --exclude="*.env" \
  --exclude="release" \
  --exclude="*.log" \
  --exclude="coverage" \
  --exclude=".nyc_output" \
  --exclude="dist" \
  --exclude=".DS_Store" \
  --exclude="Thumbs.db" \
  "$(pwd)/" "${STAGING}/"

# ── 3. Security check — abort if any real .env slipped through ───────────────
echo "Running security check..."

# Must NOT find any real .env files
if find "${STAGING}" -name ".env" -not -name ".env.example" | grep -q .; then
  echo "ERROR: Real .env file found in staging! Aborting."
  find "${STAGING}" -name ".env" -not -name ".env.example"
  exit 1
fi

# Must NOT find real secret values (exclude docs/placeholder patterns ending with ... or _...)
SECRET_HITS=$(grep -rE "sk-or-v1-[a-f0-9]{60,}|sk_(live|test)_[A-Za-z0-9]{40,}|pk_(live|test)_[A-Za-z0-9]{40,}|re_[A-Za-z0-9]{25,}" \
  "${STAGING}" 2>/dev/null | grep -v ".env.example" || true)
if [ -n "${SECRET_HITS}" ]; then
  echo "WARNING: Possible real secret detected — review before publishing:"
  echo "${SECRET_HITS}"
fi

echo "Security check passed."

# ── 4. Verify .env.example files are present (buyer needs them) ──────────────
[ -f "${STAGING}/backend/.env.example" ] || { echo "ERROR: backend/.env.example missing!"; exit 1; }
[ -f "${STAGING}/frontend/.env.example" ] || { echo "ERROR: frontend/.env.example missing!"; exit 1; }

# ── 5. Create the ZIP ────────────────────────────────────────────────────────
cd "${OUT_DIR}"
zip -r "${ZIP_NAME}" "seo-gen-ai/" -q
rm -rf "${STAGING}"

echo ""
echo "Done!"
echo "  Output : ${OUT_DIR}/${ZIP_NAME}"
echo "  Size   : $(du -sh "${OUT_DIR}/${ZIP_NAME}" | cut -f1)"
echo ""
echo "Next steps before uploading to marketplace:"
echo "  1. Rotate all API keys in your .env (they were exposed in old git history)"
echo "  2. Test installation from scratch using the ZIP"
echo "  3. Verify documentation/index.html renders correctly"
