import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyChallengeDraft } from "./legacy-challenge-draft.js";

test("LegacyChallengeDraft starts in planned", () => {
  const item = newLegacyChallengeDraft("code-382", "name-54");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyChallengeDraft moves to in progress", () => {
  const item = newLegacyChallengeDraft("code-382", "name-54");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("LegacyChallengeDraft rejects moves from cancelled", () => {
  const item = newLegacyChallengeDraft("code-382", "name-54");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
