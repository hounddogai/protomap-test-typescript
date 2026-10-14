import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictFraudCheckSummary } from "./strict-fraud-check-summary.js";

test("StrictFraudCheckSummary starts in requested", () => {
  const item = newStrictFraudCheckSummary("code-352", "label-414");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictFraudCheckSummary moves to granted", () => {
  const item = newStrictFraudCheckSummary("code-352", "label-414");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("StrictFraudCheckSummary rejects moves from expired", () => {
  const item = newStrictFraudCheckSummary("code-352", "label-414");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
