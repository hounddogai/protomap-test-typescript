import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyPreferenceReviewStore } from "./legacy-preference-review-store.js";
import { newLegacyPreferenceReview } from "./legacy-preference-review.js";

test("MemoryLegacyPreferenceReviewStore finds what it saved", () => {
  const store = newMemoryLegacyPreferenceReviewStore();
  const item = newLegacyPreferenceReview("code-981", "name-500");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
