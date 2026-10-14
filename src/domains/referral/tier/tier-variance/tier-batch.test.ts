import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierBatch } from "./tier-batch.js";

test("TierBatch starts in requested", () => {
  const item = newTierBatch("code-127", "title-262");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierBatch moves to expired", () => {
  const item = newTierBatch("code-127", "title-262");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("TierBatch rejects moves from expired", () => {
  const item = newTierBatch("code-127", "title-262");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
