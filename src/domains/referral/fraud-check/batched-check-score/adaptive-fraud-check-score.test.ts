import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveFraudCheckScore } from "./adaptive-fraud-check-score.js";

test("AdaptiveFraudCheckScore starts in created", () => {
  const item = newAdaptiveFraudCheckScore("code-63", "label-302");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveFraudCheckScore moves to retired", () => {
  const item = newAdaptiveFraudCheckScore("code-63", "label-302");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("AdaptiveFraudCheckScore rejects moves from retired", () => {
  const item = newAdaptiveFraudCheckScore("code-63", "label-302");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
