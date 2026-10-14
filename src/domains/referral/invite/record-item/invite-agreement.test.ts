import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteAgreement } from "./invite-agreement.js";

test("InviteAgreement starts in open", () => {
  const item = newInviteAgreement("code-59", "label-588");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteAgreement moves to in review", () => {
  const item = newInviteAgreement("code-59", "label-588");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("InviteAgreement rejects moves from archived", () => {
  const item = newInviteAgreement("code-59", "label-588");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
