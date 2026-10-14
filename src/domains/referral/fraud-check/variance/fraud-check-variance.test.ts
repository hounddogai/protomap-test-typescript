import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckVariance } from "./fraud-check-variance.js";

test("FraudCheckVariance starts in proposed", () => {
  const item = newFraudCheckVariance("code-367", "label-174");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckVariance moves to withdrawn", () => {
  const item = newFraudCheckVariance("code-367", "label-174");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("FraudCheckVariance rejects moves from withdrawn", () => {
  const item = newFraudCheckVariance("code-367", "label-174");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
