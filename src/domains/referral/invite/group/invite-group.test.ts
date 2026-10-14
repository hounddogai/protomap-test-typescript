import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteGroup } from "./invite-group.js";

test("InviteGroup starts in idle", () => {
  const item = newInviteGroup("code-879", "name-103");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteGroup moves to warming", () => {
  const item = newInviteGroup("code-879", "name-103");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("InviteGroup rejects moves from stopped", () => {
  const item = newInviteGroup("code-879", "name-103");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
