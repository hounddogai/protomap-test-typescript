import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteCheckpoint } from "./invite-checkpoint.js";

test("InviteCheckpoint starts in open", () => {
  const item = newInviteCheckpoint("code-191", "label-569");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteCheckpoint moves to in review", () => {
  const item = newInviteCheckpoint("code-191", "label-569");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("InviteCheckpoint rejects moves from archived", () => {
  const item = newInviteCheckpoint("code-191", "label-569");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
