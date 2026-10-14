import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackApprovalQuota } from "./fallback-approval-quota.js";

test("FallbackApprovalQuota starts in new", () => {
  const item = newFallbackApprovalQuota("code-958", "name-369");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackApprovalQuota moves to queued", () => {
  const item = newFallbackApprovalQuota("code-958", "name-369");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FallbackApprovalQuota rejects moves from failed", () => {
  const item = newFallbackApprovalQuota("code-958", "name-369");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
