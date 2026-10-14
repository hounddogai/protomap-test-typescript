import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckTier } from "./fraud-check-tier.js";

test("FraudCheckTier starts in proposed", () => {
  const item = newFraudCheckTier("code-710", "label-425");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckTier moves to approved", () => {
  const item = newFraudCheckTier("code-710", "label-425");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("FraudCheckTier rejects moves from withdrawn", () => {
  const item = newFraudCheckTier("code-710", "label-425");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
