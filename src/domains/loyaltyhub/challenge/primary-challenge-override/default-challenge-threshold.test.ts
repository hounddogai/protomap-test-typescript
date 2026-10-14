import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultChallengeThreshold } from "./default-challenge-threshold.js";

test("DefaultChallengeThreshold starts in draft", () => {
  const item = newDefaultChallengeThreshold("code-947", "title-249");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultChallengeThreshold moves to pending", () => {
  const item = newDefaultChallengeThreshold("code-947", "title-249");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("DefaultChallengeThreshold rejects moves from closed", () => {
  const item = newDefaultChallengeThreshold("code-947", "title-249");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
