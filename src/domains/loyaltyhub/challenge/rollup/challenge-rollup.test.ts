import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeRollup } from "./challenge-rollup.js";

test("ChallengeRollup starts in draft", () => {
  const item = newChallengeRollup("code-121", "name-509");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeRollup moves to pending", () => {
  const item = newChallengeRollup("code-121", "name-509");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ChallengeRollup rejects moves from closed", () => {
  const item = newChallengeRollup("code-121", "name-509");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
