import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationThreshold } from "./reputation-threshold.js";

test("ReputationThreshold starts in planned", () => {
  const item = newReputationThreshold("code-149", "label-551");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationThreshold moves to scheduled", () => {
  const item = newReputationThreshold("code-149", "label-551");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ReputationThreshold rejects moves from cancelled", () => {
  const item = newReputationThreshold("code-149", "label-551");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
