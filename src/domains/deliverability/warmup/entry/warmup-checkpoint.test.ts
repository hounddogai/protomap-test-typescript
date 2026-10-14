import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupCheckpoint } from "./warmup-checkpoint.js";

test("WarmupCheckpoint starts in idle", () => {
  const item = newWarmupCheckpoint("code-89", "label-770");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupCheckpoint moves to ready", () => {
  const item = newWarmupCheckpoint("code-89", "label-770");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("WarmupCheckpoint rejects moves from stopped", () => {
  const item = newWarmupCheckpoint("code-89", "label-770");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
