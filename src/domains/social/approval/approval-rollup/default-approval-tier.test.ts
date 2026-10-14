import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultApprovalTier } from "./default-approval-tier.js";

test("DefaultApprovalTier starts in draft", () => {
  const item = newDefaultApprovalTier("code-448", "name-962");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultApprovalTier moves to pending", () => {
  const item = newDefaultApprovalTier("code-448", "name-962");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("DefaultApprovalTier rejects moves from closed", () => {
  const item = newDefaultApprovalTier("code-448", "name-962");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
