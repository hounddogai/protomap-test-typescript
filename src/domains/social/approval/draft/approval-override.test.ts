import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalOverride } from "./approval-override.js";

test("ApprovalOverride starts in new", () => {
  const item = newApprovalOverride("code-751", "title-427");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalOverride moves to queued", () => {
  const item = newApprovalOverride("code-751", "title-427");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ApprovalOverride rejects moves from failed", () => {
  const item = newApprovalOverride("code-751", "title-427");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
