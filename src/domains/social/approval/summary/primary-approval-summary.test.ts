import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryApprovalSummary } from "./primary-approval-summary.js";

test("PrimaryApprovalSummary starts in idle", () => {
  const item = newPrimaryApprovalSummary("code-350", "label-558");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryApprovalSummary moves to draining", () => {
  const item = newPrimaryApprovalSummary("code-350", "label-558");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("PrimaryApprovalSummary rejects moves from stopped", () => {
  const item = newPrimaryApprovalSummary("code-350", "label-558");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
