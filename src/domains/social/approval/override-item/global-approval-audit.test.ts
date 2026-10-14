import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalApprovalAudit } from "./global-approval-audit.js";

test("GlobalApprovalAudit starts in open", () => {
  const item = newGlobalApprovalAudit("code-379", "name-96");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalApprovalAudit moves to resolved", () => {
  const item = newGlobalApprovalAudit("code-379", "name-96");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("GlobalApprovalAudit rejects moves from archived", () => {
  const item = newGlobalApprovalAudit("code-379", "name-96");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
