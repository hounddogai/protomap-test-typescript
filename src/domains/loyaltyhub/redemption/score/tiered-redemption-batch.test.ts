import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredRedemptionBatch } from "./tiered-redemption-batch.js";

test("TieredRedemptionBatch starts in created", () => {
  const item = newTieredRedemptionBatch("code-27", "label-630");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredRedemptionBatch moves to published", () => {
  const item = newTieredRedemptionBatch("code-27", "label-630");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("TieredRedemptionBatch rejects moves from retired", () => {
  const item = newTieredRedemptionBatch("code-27", "label-630");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
