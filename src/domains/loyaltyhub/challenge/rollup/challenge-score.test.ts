import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeScore } from "./challenge-score.js";

test("ChallengeScore starts in new", () => {
  const item = newChallengeScore("code-301", "name-21");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeScore moves to done", () => {
  const item = newChallengeScore("code-301", "name-21");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("ChallengeScore rejects moves from failed", () => {
  const item = newChallengeScore("code-301", "name-21");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
