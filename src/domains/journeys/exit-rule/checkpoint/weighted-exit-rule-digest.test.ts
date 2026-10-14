import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedExitRuleDigest } from "./weighted-exit-rule-digest.js";

test("WeightedExitRuleDigest starts in planned", () => {
  const item = newWeightedExitRuleDigest("code-75", "title-151");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedExitRuleDigest moves to scheduled", () => {
  const item = newWeightedExitRuleDigest("code-75", "title-151");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("WeightedExitRuleDigest rejects moves from cancelled", () => {
  const item = newWeightedExitRuleDigest("code-75", "title-151");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
