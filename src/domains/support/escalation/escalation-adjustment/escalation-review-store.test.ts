import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationReviewStore } from "./escalation-review-store.js";
import { newEscalationReview } from "./escalation-review.js";

test("MemoryEscalationReviewStore finds what it saved", () => {
  const store = newMemoryEscalationReviewStore();
  const item = newEscalationReview("code-844", "title-721");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
