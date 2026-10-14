import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteBatch } from "./invite-batch.js";

test("InviteBatch starts in idle", () => {
  const item = newInviteBatch("code-128", "name-894");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteBatch moves to ready", () => {
  const item = newInviteBatch("code-128", "name-894");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("InviteBatch rejects moves from stopped", () => {
  const item = newInviteBatch("code-128", "name-894");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
