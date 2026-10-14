import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierThreshold } from "./tier-threshold.js";

test("TierThreshold starts in created", () => {
  const item = newTierThreshold("code-995", "label-156");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierThreshold moves to retired", () => {
  const item = newTierThreshold("code-995", "label-156");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("TierThreshold rejects moves from retired", () => {
  const item = newTierThreshold("code-995", "label-156");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
