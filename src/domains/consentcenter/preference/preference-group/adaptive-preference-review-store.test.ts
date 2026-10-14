import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptivePreferenceReviewStore } from "./adaptive-preference-review-store.js";
import { newAdaptivePreferenceReview } from "./adaptive-preference-review.js";

test("MemoryAdaptivePreferenceReviewStore finds what it saved", () => {
  const store = newMemoryAdaptivePreferenceReviewStore();
  const item = newAdaptivePreferenceReview("code-144", "title-640");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
