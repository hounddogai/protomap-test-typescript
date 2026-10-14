import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientChallengeCheckpoint } from "./lenient-challenge-checkpoint.js";

test("LenientChallengeCheckpoint starts in idle", () => {
  const item = newLenientChallengeCheckpoint("code-479", "label-335");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientChallengeCheckpoint moves to warming", () => {
  const item = newLenientChallengeCheckpoint("code-479", "label-335");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LenientChallengeCheckpoint rejects moves from stopped", () => {
  const item = newLenientChallengeCheckpoint("code-479", "label-335");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
