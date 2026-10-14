import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalPaywallReviewStore } from "./seasonal-paywall-review-store.js";
import { newSeasonalPaywallReview } from "./seasonal-paywall-review.js";

test("MemorySeasonalPaywallReviewStore finds what it saved", () => {
  const store = newMemorySeasonalPaywallReviewStore();
  const item = newSeasonalPaywallReview("code-710", "name-269");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
