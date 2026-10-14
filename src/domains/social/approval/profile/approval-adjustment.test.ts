import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalAdjustment } from "./approval-adjustment.js";

test("ApprovalAdjustment starts in new", () => {
  const item = newApprovalAdjustment("code-730", "title-339");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalAdjustment moves to failed", () => {
  const item = newApprovalAdjustment("code-730", "title-339");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("ApprovalAdjustment rejects moves from failed", () => {
  const item = newApprovalAdjustment("code-730", "title-339");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
