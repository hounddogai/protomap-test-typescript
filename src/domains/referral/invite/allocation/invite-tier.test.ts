import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteTier } from "./invite-tier.js";

test("InviteTier starts in open", () => {
  const item = newInviteTier("code-82", "title-735");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteTier moves to in review", () => {
  const item = newInviteTier("code-82", "title-735");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("InviteTier rejects moves from archived", () => {
  const item = newInviteTier("code-82", "title-735");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
