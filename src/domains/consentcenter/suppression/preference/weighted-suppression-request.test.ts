import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedSuppressionRequest } from "./weighted-suppression-request.js";

test("WeightedSuppressionRequest starts in proposed", () => {
  const item = newWeightedSuppressionRequest("code-829", "label-796");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedSuppressionRequest moves to approved", () => {
  const item = newWeightedSuppressionRequest("code-829", "label-796");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WeightedSuppressionRequest rejects moves from withdrawn", () => {
  const item = newWeightedSuppressionRequest("code-829", "label-796");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
