import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalPayoutLedger } from "./seasonal-payout-ledger.js";

test("SeasonalPayoutLedger starts in new", () => {
  const item = newSeasonalPayoutLedger("code-22", "title-148");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalPayoutLedger moves to queued", () => {
  const item = newSeasonalPayoutLedger("code-22", "title-148");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("SeasonalPayoutLedger rejects moves from failed", () => {
  const item = newSeasonalPayoutLedger("code-22", "title-148");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
