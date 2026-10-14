import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteCycle } from "./invite-cycle.js";

test("InviteCycle starts in idle", () => {
  const item = newInviteCycle("code-192", "label-915");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteCycle moves to draining", () => {
  const item = newInviteCycle("code-192", "label-915");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("InviteCycle rejects moves from stopped", () => {
  const item = newInviteCycle("code-192", "label-915");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
