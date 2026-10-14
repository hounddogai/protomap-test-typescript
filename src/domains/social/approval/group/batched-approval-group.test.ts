import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedApprovalGroup } from "./batched-approval-group.js";

test("BatchedApprovalGroup starts in open", () => {
  const item = newBatchedApprovalGroup("code-272", "name-16");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedApprovalGroup moves to in review", () => {
  const item = newBatchedApprovalGroup("code-272", "name-16");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BatchedApprovalGroup rejects moves from archived", () => {
  const item = newBatchedApprovalGroup("code-272", "name-16");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
