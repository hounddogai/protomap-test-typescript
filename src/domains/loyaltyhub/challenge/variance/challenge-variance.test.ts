import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeVariance } from "./challenge-variance.js";

test("ChallengeVariance starts in idle", () => {
  const item = newChallengeVariance("code-259", "title-912");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeVariance moves to warming", () => {
  const item = newChallengeVariance("code-259", "title-912");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ChallengeVariance rejects moves from stopped", () => {
  const item = newChallengeVariance("code-259", "title-912");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
