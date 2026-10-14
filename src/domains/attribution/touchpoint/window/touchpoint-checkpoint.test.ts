import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointCheckpoint } from "./touchpoint-checkpoint.js";

test("TouchpointCheckpoint starts in idle", () => {
  const item = newTouchpointCheckpoint("code-852", "label-243");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointCheckpoint moves to warming", () => {
  const item = newTouchpointCheckpoint("code-852", "label-243");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("TouchpointCheckpoint rejects moves from stopped", () => {
  const item = newTouchpointCheckpoint("code-852", "label-243");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
