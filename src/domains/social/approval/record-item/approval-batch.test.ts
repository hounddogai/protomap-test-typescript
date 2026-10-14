import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalBatch } from "./approval-batch.js";

test("ApprovalBatch starts in new", () => {
  const item = newApprovalBatch("code-394", "name-51");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalBatch moves to queued", () => {
  const item = newApprovalBatch("code-394", "name-51");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ApprovalBatch rejects moves from failed", () => {
  const item = newApprovalBatch("code-394", "name-51");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
