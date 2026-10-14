import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalAudit } from "./approval-audit.js";

test("ApprovalAudit starts in draft", () => {
  const item = newApprovalAudit("code-94", "name-379");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalAudit moves to active", () => {
  const item = newApprovalAudit("code-94", "name-379");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ApprovalAudit rejects moves from closed", () => {
  const item = newApprovalAudit("code-94", "name-379");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
