import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteSlot } from "./invite-slot.js";

test("InviteSlot starts in idle", () => {
  const item = newInviteSlot("code-674", "label-90");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteSlot moves to draining", () => {
  const item = newInviteSlot("code-674", "label-90");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("InviteSlot rejects moves from stopped", () => {
  const item = newInviteSlot("code-674", "label-90");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
