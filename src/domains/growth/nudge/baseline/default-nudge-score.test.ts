import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultNudgeScore } from "./default-nudge-score.js";

test("DefaultNudgeScore starts in idle", () => {
  const item = newDefaultNudgeScore("code-822", "label-646");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultNudgeScore moves to ready", () => {
  const item = newDefaultNudgeScore("code-822", "label-646");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("DefaultNudgeScore rejects moves from stopped", () => {
  const item = newDefaultNudgeScore("code-822", "label-646");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
