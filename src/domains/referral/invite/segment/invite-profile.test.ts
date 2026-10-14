import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteProfile } from "./invite-profile.js";

test("InviteProfile starts in idle", () => {
  const item = newInviteProfile("code-63", "title-666");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteProfile moves to ready", () => {
  const item = newInviteProfile("code-63", "title-666");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("InviteProfile rejects moves from stopped", () => {
  const item = newInviteProfile("code-63", "title-666");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
