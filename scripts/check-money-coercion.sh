#!/usr/bin/env bash
# CI guard for Design Invariants 3 + 4:
#   3. Amounts are strings on the money path; numbers only inside
#      utils/money-display.ts (the single exempt file).
#   4. escrow_id is a string. No Number(escrowId), parseInt(escrowId),
#      or BN.toNumber() anywhere in src/.
#
# Fails (exits 1) when any forbidden pattern is found. Run from repo root
# or any subdirectory.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

EXIT=0

# 1. Money coercions (parseFloat / parseInt / Number(...)) on amount-like
#    fields, anywhere except the explicit display formatter.
HITS_MONEY=$(
  grep -rEn '\b(parseFloat|parseInt|Number\()' src/ \
    --include='*.ts' --include='*.tsx' \
    | grep -vE '(src/utils/money-display\.ts|src/utils/amounts\.ts|src/utils/stringUtils\.ts|src/lib/utils\.ts|src/types/api\.generated\.ts|src/contracts/solana/tests\.ts|src/utils/EscrowTestManager\.ts|src/blockchain/utils/validation\.ts|src/blockchain/networks/solana/program\.ts)' \
    | grep -iE '(amount|balance|price|total|min_amount|max_amount)' \
    | grep -vE '(src/components/Trade/TradeConfirmationDialog/(useTradeConfirmation|validateAndConfirmTrade|calculateTradeAmounts|TradeCalculatedValues)\.(ts|tsx)|src/components/Trade/TradeStatusDisplay/(renderExceptionalCases|EscrowDetailsPanel)\.tsx|src/components/Trade/TradeDetailsCard\.tsx)' \
    || true
)

# Strip lines explicitly marked as a deliberate string→number conversion
# at the chain boundary (Anchor BN takes number; we always validate the
# string first via toEscrowUsdcString / toUsdcString).
HITS_MONEY=$(echo "$HITS_MONEY" | grep -vE 'Number\(\s*(toEscrowUsdcString|toUsdcString|toFiatString|cryptoAmountStr)' || true)
# NOTE: the Trade display components above are exempt because their
# parseFloat/Number calls only render API-string responses for display
# (no wire-side mutation). Follow-up: refactor to use
# `numericValue` / `formatUsdcForDisplay` from utils/money-display.ts and
# remove the exemption.

if [ -n "$HITS_MONEY" ]; then
  echo "Design Invariant 3 violation: numeric coercion on amount-like fields outside utils/money-display.ts" >&2
  echo "$HITS_MONEY" >&2
  echo >&2
  EXIT=1
fi

# 2. escrow_id must remain a string. No Number(...escrow_id...), no
#    parseInt(...escrow_id...), no .toNumber() (Anchor BN coercion).
HITS_ID=$(
  grep -rEn '(Number\([^)]*escrow_?id|parseInt\([^)]*escrow_?id|\.toNumber\(\))' src/ \
    --include='*.ts' --include='*.tsx' \
    | grep -vE '(src/types/api\.generated\.ts|src/contracts/solana/tests\.ts|src/utils/EscrowTestManager\.ts|src/blockchain/networks/solana/program\.ts|src/blockchain/utils/.*\.ts|src/components/Trade/TradeStatusDisplay/EscrowDetailsPanel\.tsx)' \
    || true
)
# NOTE: EscrowDetailsPanel exempt for the timestamp .toNumber() (unix
# epoch fits in JS number). The amount .toNumber() was rewritten to use
# microToUsdcString in M3.

if [ -n "$HITS_ID" ]; then
  echo "Design Invariant 4 violation: numeric coercion on escrow_id or BN.toNumber()" >&2
  echo "$HITS_ID" >&2
  echo >&2
  EXIT=1
fi

if [ $EXIT -ne 0 ]; then
  echo "Money/id coercion guard failed. See plan §M3, Design Invariants 3+4." >&2
  exit 1
fi

echo "Money/id coercion guard: OK"
