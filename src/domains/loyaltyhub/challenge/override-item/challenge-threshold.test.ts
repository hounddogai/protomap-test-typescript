import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeThreshold } from "./challenge-threshold.js";

test("ChallengeThreshold starts in planned", () => {
  const item = newChallengeThreshold("code-92", "name-175");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeThreshold moves to in progress", () => {
  const item = newChallengeThreshold("code-92", "name-175");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ChallengeThreshold rejects moves from cancelled", () => {
  const item = newChallengeThreshold("code-92", "name-175");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
