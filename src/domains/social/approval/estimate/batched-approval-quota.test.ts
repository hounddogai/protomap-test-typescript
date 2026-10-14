import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedApprovalQuota } from "./batched-approval-quota.js";

test("BatchedApprovalQuota starts in requested", () => {
  const item = newBatchedApprovalQuota("code-929", "title-128");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedApprovalQuota moves to granted", () => {
  const item = newBatchedApprovalQuota("code-929", "title-128");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("BatchedApprovalQuota rejects moves from expired", () => {
  const item = newBatchedApprovalQuota("code-929", "title-128");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
