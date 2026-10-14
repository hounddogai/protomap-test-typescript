import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeOverride } from "./challenge-override.js";

test("ChallengeOverride starts in planned", () => {
  const item = newChallengeOverride("code-334", "name-199");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeOverride moves to in progress", () => {
  const item = newChallengeOverride("code-334", "name-199");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ChallengeOverride rejects moves from cancelled", () => {
  const item = newChallengeOverride("code-334", "name-199");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
