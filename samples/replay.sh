#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
#  replay.sh – Send all sample payloads to the webhook
#  Usage: ./samples/replay.sh [WEBHOOK_URL]
#  Example: ./samples/replay.sh http://localhost:5678/webhook/support-ticket
# ─────────────────────────────────────────────────────────

WEBHOOK_URL="${1:-http://localhost:5678/webhook/support-ticket}"
SAMPLES_DIR="$(dirname "$0")"

echo "======================================================"
echo " Support Inbox Triage – Payload Replay"
echo " Target: $WEBHOOK_URL"
echo "======================================================"
echo ""

send_payload() {
  local FILE="$1"
  local LABEL="$2"
  echo "── $LABEL ──────────────────────────────────────"
  echo "Payload: $(cat "$FILE")"
  echo ""
  RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d @"$FILE")
  echo "Response: $RESPONSE"
  echo ""
}

send_payload "$SAMPLES_DIR/billing_01.json"          "BILLING #1 – Overcharge refund (expected: billing/medium)"
send_payload "$SAMPLES_DIR/billing_02.json"          "BILLING #2 – Payment receipt (expected: billing/low)"
send_payload "$SAMPLES_DIR/bug_01.json"              "BUG #1 – App crash login (expected: bug/high)"
send_payload "$SAMPLES_DIR/bug_02.json"              "BUG #2 – Export frozen (expected: bug/medium)"
send_payload "$SAMPLES_DIR/feature_01.json"          "FEATURE #1 – Dark mode (expected: feature_request/low)"
send_payload "$SAMPLES_DIR/feature_02.json"          "FEATURE #2 – Bulk import (expected: feature_request/low)"
send_payload "$SAMPLES_DIR/general_01.json"          "GENERAL #1 – Onboarding query (expected: general/low)"

echo "── DUPLICATE TEST ──────────────────────────────"
echo "Sending TCK_2007 again – should return duplicate_ignored"
echo ""
send_payload "$SAMPLES_DIR/general_02_DUPLICATE.json" "GENERAL #2 – DUPLICATE of TCK_2007 (expected: duplicate_ignored)"

echo "======================================================"
echo " Replay complete."
echo "======================================================"
