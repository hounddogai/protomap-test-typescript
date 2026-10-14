import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleReviewStore } from "./reward-rule-review-store.js";
import { newRewardRuleReview } from "./reward-rule-review.js";

test("MemoryRewardRuleReviewStore finds what it saved", () => {
  const store = newMemoryRewardRuleReviewStore();
  const item = newRewardRuleReview("code-950", "title-26");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
