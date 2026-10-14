import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyChallengePreference } from "./legacy-challenge-preference.js";

test("LegacyChallengePreference starts in planned", () => {
  const item = newLegacyChallengePreference("code-742", "title-103");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyChallengePreference moves to in progress", () => {
  const item = newLegacyChallengePreference("code-742", "title-103");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("LegacyChallengePreference rejects moves from cancelled", () => {
  const item = newLegacyChallengePreference("code-742", "title-103");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
