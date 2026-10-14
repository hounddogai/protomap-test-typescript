import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictInviteGroup } from "./strict-invite-group.js";

test("StrictInviteGroup starts in new", () => {
  const item = newStrictInviteGroup("code-59", "name-672");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictInviteGroup moves to queued", () => {
  const item = newStrictInviteGroup("code-59", "name-672");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("StrictInviteGroup rejects moves from failed", () => {
  const item = newStrictInviteGroup("code-59", "name-672");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
