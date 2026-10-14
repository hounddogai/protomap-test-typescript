import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteTarget } from "./invite-target.js";

test("InviteTarget starts in new", () => {
  const item = newInviteTarget("code-290", "label-183");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteTarget moves to queued", () => {
  const item = newInviteTarget("code-290", "label-183");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("InviteTarget rejects moves from failed", () => {
  const item = newInviteTarget("code-290", "label-183");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
