import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleReviewStore } from "./exit-rule-review-store.js";
import { newExitRuleReview } from "./exit-rule-review.js";

test("MemoryExitRuleReviewStore finds what it saved", () => {
  const store = newMemoryExitRuleReviewStore();
  const item = newExitRuleReview("code-415", "label-714");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
