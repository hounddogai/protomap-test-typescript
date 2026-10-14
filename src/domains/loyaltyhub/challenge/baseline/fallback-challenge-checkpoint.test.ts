import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackChallengeCheckpoint } from "./fallback-challenge-checkpoint.js";

test("FallbackChallengeCheckpoint starts in new", () => {
  const item = newFallbackChallengeCheckpoint("code-255", "name-487");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackChallengeCheckpoint moves to queued", () => {
  const item = newFallbackChallengeCheckpoint("code-255", "name-487");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FallbackChallengeCheckpoint rejects moves from failed", () => {
  const item = newFallbackChallengeCheckpoint("code-255", "name-487");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
