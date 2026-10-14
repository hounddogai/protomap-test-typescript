import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveBranchSummary } from "./adaptive-branch-summary.js";

test("AdaptiveBranchSummary starts in planned", () => {
  const item = newAdaptiveBranchSummary("code-536", "label-540");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveBranchSummary moves to scheduled", () => {
  const item = newAdaptiveBranchSummary("code-536", "label-540");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("AdaptiveBranchSummary rejects moves from cancelled", () => {
  const item = newAdaptiveBranchSummary("code-536", "label-540");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
