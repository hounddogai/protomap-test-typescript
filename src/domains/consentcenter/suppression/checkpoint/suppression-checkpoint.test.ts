import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionCheckpoint } from "./suppression-checkpoint.js";

test("SuppressionCheckpoint starts in idle", () => {
  const item = newSuppressionCheckpoint("code-702", "label-607");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionCheckpoint moves to stopped", () => {
  const item = newSuppressionCheckpoint("code-702", "label-607");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("SuppressionCheckpoint rejects moves from stopped", () => {
  const item = newSuppressionCheckpoint("code-702", "label-607");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
