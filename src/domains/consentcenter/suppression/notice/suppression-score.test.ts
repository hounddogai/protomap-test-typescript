import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionScore } from "./suppression-score.js";

test("SuppressionScore starts in idle", () => {
  const item = newSuppressionScore("code-985", "label-637");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionScore moves to ready", () => {
  const item = newSuppressionScore("code-985", "label-637");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("SuppressionScore rejects moves from stopped", () => {
  const item = newSuppressionScore("code-985", "label-637");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
