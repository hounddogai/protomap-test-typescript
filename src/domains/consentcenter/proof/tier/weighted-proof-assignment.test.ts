import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedProofAssignment } from "./weighted-proof-assignment.js";

test("WeightedProofAssignment starts in new", () => {
  const item = newWeightedProofAssignment("code-577", "name-347");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedProofAssignment moves to failed", () => {
  const item = newWeightedProofAssignment("code-577", "name-347");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("WeightedProofAssignment rejects moves from failed", () => {
  const item = newWeightedProofAssignment("code-577", "name-347");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
