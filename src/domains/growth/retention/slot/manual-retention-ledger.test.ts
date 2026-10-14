import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualRetentionLedger } from "./manual-retention-ledger.js";

test("ManualRetentionLedger starts in planned", () => {
  const item = newManualRetentionLedger("code-283", "title-306");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualRetentionLedger moves to in progress", () => {
  const item = newManualRetentionLedger("code-283", "title-306");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ManualRetentionLedger rejects moves from cancelled", () => {
  const item = newManualRetentionLedger("code-283", "title-306");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
