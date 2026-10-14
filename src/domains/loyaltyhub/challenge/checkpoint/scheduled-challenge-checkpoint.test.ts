import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledChallengeCheckpoint } from "./scheduled-challenge-checkpoint.js";

test("ScheduledChallengeCheckpoint starts in open", () => {
  const item = newScheduledChallengeCheckpoint("code-8", "name-543");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledChallengeCheckpoint moves to resolved", () => {
  const item = newScheduledChallengeCheckpoint("code-8", "name-543");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ScheduledChallengeCheckpoint rejects moves from archived", () => {
  const item = newScheduledChallengeCheckpoint("code-8", "name-543");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
