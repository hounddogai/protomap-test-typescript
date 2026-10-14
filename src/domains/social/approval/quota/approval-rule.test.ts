import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalRule } from "./approval-rule.js";

test("ApprovalRule starts in requested", () => {
  const item = newApprovalRule("code-174", "title-876");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalRule moves to revoked", () => {
  const item = newApprovalRule("code-174", "title-876");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ApprovalRule rejects moves from expired", () => {
  const item = newApprovalRule("code-174", "title-876");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
