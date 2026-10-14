import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeTarget } from "./challenge-target.js";

test("ChallengeTarget starts in created", () => {
  const item = newChallengeTarget("code-713", "name-237");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeTarget moves to validated", () => {
  const item = newChallengeTarget("code-713", "name-237");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ChallengeTarget rejects moves from retired", () => {
  const item = newChallengeTarget("code-713", "name-237");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
