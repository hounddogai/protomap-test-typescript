import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeAssignment } from "./challenge-assignment.js";

test("ChallengeAssignment starts in draft", () => {
  const item = newChallengeAssignment("code-785", "name-561");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeAssignment moves to pending", () => {
  const item = newChallengeAssignment("code-785", "name-561");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ChallengeAssignment rejects moves from closed", () => {
  const item = newChallengeAssignment("code-785", "name-561");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
