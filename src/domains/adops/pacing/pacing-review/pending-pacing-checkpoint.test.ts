import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingPacingCheckpoint } from "./pending-pacing-checkpoint.js";

test("PendingPacingCheckpoint starts in idle", () => {
  const item = newPendingPacingCheckpoint("code-263", "name-326");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingPacingCheckpoint moves to ready", () => {
  const item = newPendingPacingCheckpoint("code-263", "name-326");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("PendingPacingCheckpoint rejects moves from stopped", () => {
  const item = newPendingPacingCheckpoint("code-263", "name-326");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
