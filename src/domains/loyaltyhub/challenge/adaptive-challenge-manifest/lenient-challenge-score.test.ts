import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientChallengeScore } from "./lenient-challenge-score.js";

test("LenientChallengeScore starts in planned", () => {
  const item = newLenientChallengeScore("code-899", "name-480");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientChallengeScore moves to scheduled", () => {
  const item = newLenientChallengeScore("code-899", "name-480");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LenientChallengeScore rejects moves from cancelled", () => {
  const item = newLenientChallengeScore("code-899", "name-480");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
