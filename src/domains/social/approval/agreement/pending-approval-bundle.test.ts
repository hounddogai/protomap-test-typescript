import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingApprovalBundle } from "./pending-approval-bundle.js";

test("PendingApprovalBundle starts in idle", () => {
  const item = newPendingApprovalBundle("code-714", "title-347");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingApprovalBundle moves to warming", () => {
  const item = newPendingApprovalBundle("code-714", "title-347");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PendingApprovalBundle rejects moves from stopped", () => {
  const item = newPendingApprovalBundle("code-714", "title-347");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
