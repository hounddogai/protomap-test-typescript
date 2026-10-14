import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteRollup } from "./invite-rollup.js";

test("InviteRollup starts in new", () => {
  const item = newInviteRollup("code-820", "label-843");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteRollup moves to queued", () => {
  const item = newInviteRollup("code-820", "label-843");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("InviteRollup rejects moves from failed", () => {
  const item = newInviteRollup("code-820", "label-843");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
