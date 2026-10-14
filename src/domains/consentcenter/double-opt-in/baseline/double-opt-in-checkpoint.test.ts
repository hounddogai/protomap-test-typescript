import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInCheckpoint } from "./double-opt-in-checkpoint.js";

test("DoubleOptInCheckpoint starts in idle", () => {
  const item = newDoubleOptInCheckpoint("code-317", "title-928");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInCheckpoint moves to ready", () => {
  const item = newDoubleOptInCheckpoint("code-317", "title-928");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("DoubleOptInCheckpoint rejects moves from stopped", () => {
  const item = newDoubleOptInCheckpoint("code-317", "title-928");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
