import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteAudit } from "./invite-audit.js";

test("InviteAudit starts in open", () => {
  const item = newInviteAudit("code-731", "title-523");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteAudit moves to in review", () => {
  const item = newInviteAudit("code-731", "title-523");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("InviteAudit rejects moves from archived", () => {
  const item = newInviteAudit("code-731", "title-523");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
