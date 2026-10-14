import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeException } from "./challenge-exception.js";

test("ChallengeException starts in proposed", () => {
  const item = newChallengeException("code-780", "label-379");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeException moves to rejected", () => {
  const item = newChallengeException("code-780", "label-379");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ChallengeException rejects moves from withdrawn", () => {
  const item = newChallengeException("code-780", "label-379");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
