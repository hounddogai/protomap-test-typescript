import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingApprovalThreshold } from "./pending-approval-threshold.js";

test("PendingApprovalThreshold starts in new", () => {
  const item = newPendingApprovalThreshold("code-768", "name-829");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingApprovalThreshold moves to queued", () => {
  const item = newPendingApprovalThreshold("code-768", "name-829");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PendingApprovalThreshold rejects moves from failed", () => {
  const item = newPendingApprovalThreshold("code-768", "name-829");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
