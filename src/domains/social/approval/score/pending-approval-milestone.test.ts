import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingApprovalMilestone } from "./pending-approval-milestone.js";

test("PendingApprovalMilestone starts in planned", () => {
  const item = newPendingApprovalMilestone("code-341", "title-3");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingApprovalMilestone moves to completed", () => {
  const item = newPendingApprovalMilestone("code-341", "title-3");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("PendingApprovalMilestone rejects moves from cancelled", () => {
  const item = newPendingApprovalMilestone("code-341", "title-3");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
