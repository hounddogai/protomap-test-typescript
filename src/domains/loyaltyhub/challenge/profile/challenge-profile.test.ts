import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeProfile } from "./challenge-profile.js";

test("ChallengeProfile starts in proposed", () => {
  const item = newChallengeProfile("code-570", "title-52");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeProfile moves to rejected", () => {
  const item = newChallengeProfile("code-570", "title-52");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ChallengeProfile rejects moves from withdrawn", () => {
  const item = newChallengeProfile("code-570", "title-52");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
