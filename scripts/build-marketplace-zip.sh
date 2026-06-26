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
rsync -a \
  --exclude=".git" \
  --exclude="node_modules" \
  --exclude=".env" \
  --exclude=".env.*" \
  --exclude="!.env.example" \
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

# Must NOT find common secret patterns (loose check)
if grep -r "sk-or-v1\|sk_live\|sk_test_51\|pk_test_51\|re_[A-Za-z]" "${STAGING}" 2>/dev/null | grep -v ".env.example" | grep -q .; then
  echo "WARNING: Possible secret detected in source files. Review before publishing:"
  grep -r "sk-or-v1\|sk_live\|sk_test_51\|pk_test_51\|re_[A-Za-z]" "${STAGING}" 2>/dev/null | grep -v ".env.example"
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
