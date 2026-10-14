import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPayoutBatch } from "./fallback-payout-batch.js";

test("FallbackPayoutBatch starts in created", () => {
  const item = newFallbackPayoutBatch("code-566", "title-57");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPayoutBatch moves to validated", () => {
  const item = newFallbackPayoutBatch("code-566", "title-57");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FallbackPayoutBatch rejects moves from retired", () => {
  const item = newFallbackPayoutBatch("code-566", "title-57");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
