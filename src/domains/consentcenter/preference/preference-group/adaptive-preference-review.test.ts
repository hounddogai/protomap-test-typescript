import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptivePreferenceReview } from "./adaptive-preference-review.js";

test("AdaptivePreferenceReview starts in planned", () => {
  const item = newAdaptivePreferenceReview("code-144", "title-640");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptivePreferenceReview moves to in progress", () => {
  const item = newAdaptivePreferenceReview("code-144", "title-640");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("AdaptivePreferenceReview rejects moves from cancelled", () => {
  const item = newAdaptivePreferenceReview("code-144", "title-640");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
