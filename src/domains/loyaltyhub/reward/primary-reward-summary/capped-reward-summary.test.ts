import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedRewardSummary } from "./capped-reward-summary.js";

test("CappedRewardSummary starts in new", () => {
  const item = newCappedRewardSummary("code-246", "label-466");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedRewardSummary moves to running", () => {
  const item = newCappedRewardSummary("code-246", "label-466");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("CappedRewardSummary rejects moves from failed", () => {
  const item = newCappedRewardSummary("code-246", "label-466");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
