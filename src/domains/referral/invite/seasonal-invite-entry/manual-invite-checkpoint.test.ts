import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualInviteCheckpoint } from "./manual-invite-checkpoint.js";

test("ManualInviteCheckpoint starts in open", () => {
  const item = newManualInviteCheckpoint("code-722", "label-823");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualInviteCheckpoint moves to resolved", () => {
  const item = newManualInviteCheckpoint("code-722", "label-823");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ManualInviteCheckpoint rejects moves from archived", () => {
  const item = newManualInviteCheckpoint("code-722", "label-823");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
