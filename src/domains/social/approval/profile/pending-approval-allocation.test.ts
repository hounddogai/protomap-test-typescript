import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingApprovalAllocation } from "./pending-approval-allocation.js";

test("PendingApprovalAllocation starts in draft", () => {
  const item = newPendingApprovalAllocation("code-628", "name-207");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingApprovalAllocation moves to pending", () => {
  const item = newPendingApprovalAllocation("code-628", "name-207");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PendingApprovalAllocation rejects moves from closed", () => {
  const item = newPendingApprovalAllocation("code-628", "name-207");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
