import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyPreferenceReview } from "./legacy-preference-review.js";

test("LegacyPreferenceReview starts in created", () => {
  const item = newLegacyPreferenceReview("code-981", "name-500");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyPreferenceReview moves to published", () => {
  const item = newLegacyPreferenceReview("code-981", "name-500");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LegacyPreferenceReview rejects moves from retired", () => {
  const item = newLegacyPreferenceReview("code-981", "name-500");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
