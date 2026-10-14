import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultChallengeVariance } from "./default-challenge-variance.js";

test("DefaultChallengeVariance starts in created", () => {
  const item = newDefaultChallengeVariance("code-398", "name-788");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultChallengeVariance moves to validated", () => {
  const item = newDefaultChallengeVariance("code-398", "name-788");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("DefaultChallengeVariance rejects moves from retired", () => {
  const item = newDefaultChallengeVariance("code-398", "name-788");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
