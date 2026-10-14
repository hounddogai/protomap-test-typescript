import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryExitRuleReviewStore } from "./primary-exit-rule-review-store.js";
import { newPrimaryExitRuleReview } from "./primary-exit-rule-review.js";

test("MemoryPrimaryExitRuleReviewStore finds what it saved", () => {
  const store = newMemoryPrimaryExitRuleReviewStore();
  const item = newPrimaryExitRuleReview("code-813", "name-736");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
