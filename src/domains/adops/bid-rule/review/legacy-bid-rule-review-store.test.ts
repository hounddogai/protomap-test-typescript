import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyBidRuleReviewStore } from "./legacy-bid-rule-review-store.js";
import { newLegacyBidRuleReview } from "./legacy-bid-rule-review.js";

test("MemoryLegacyBidRuleReviewStore finds what it saved", () => {
  const store = newMemoryLegacyBidRuleReviewStore();
  const item = newLegacyBidRuleReview("code-102", "label-128");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
