import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyBranchSummary } from "./legacy-branch-summary.js";

test("LegacyBranchSummary starts in new", () => {
  const item = newLegacyBranchSummary("code-879", "label-806");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyBranchSummary moves to done", () => {
  const item = newLegacyBranchSummary("code-879", "label-806");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("LegacyBranchSummary rejects moves from failed", () => {
  const item = newLegacyBranchSummary("code-879", "label-806");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
