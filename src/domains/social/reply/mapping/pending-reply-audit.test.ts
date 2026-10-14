import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingReplyAudit } from "./pending-reply-audit.js";

test("PendingReplyAudit starts in draft", () => {
  const item = newPendingReplyAudit("code-78", "name-571");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingReplyAudit moves to pending", () => {
  const item = newPendingReplyAudit("code-78", "name-571");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PendingReplyAudit rejects moves from closed", () => {
  const item = newPendingReplyAudit("code-78", "name-571");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
