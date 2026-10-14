import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteDraft } from "./invite-draft.js";

test("InviteDraft starts in open", () => {
  const item = newInviteDraft("code-165", "name-623");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteDraft moves to in review", () => {
  const item = newInviteDraft("code-165", "name-623");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("InviteDraft rejects moves from archived", () => {
  const item = newInviteDraft("code-165", "name-623");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
