import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingPaywallReviewStore } from "./rolling-paywall-review-store.js";
import { newRollingPaywallReview } from "./rolling-paywall-review.js";

test("MemoryRollingPaywallReviewStore finds what it saved", () => {
  const store = newMemoryRollingPaywallReviewStore();
  const item = newRollingPaywallReview("code-688", "title-150");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
