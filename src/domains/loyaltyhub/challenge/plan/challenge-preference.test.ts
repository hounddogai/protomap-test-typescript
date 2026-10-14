import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengePreference } from "./challenge-preference.js";

test("ChallengePreference starts in draft", () => {
  const item = newChallengePreference("code-217", "name-858");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengePreference moves to active", () => {
  const item = newChallengePreference("code-217", "name-858");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ChallengePreference rejects moves from closed", () => {
  const item = newChallengePreference("code-217", "name-858");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
