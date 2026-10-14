import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualEscalationReviewStore } from "./manual-escalation-review-store.js";
import { newManualEscalationReview } from "./manual-escalation-review.js";

test("MemoryManualEscalationReviewStore finds what it saved", () => {
  const store = newMemoryManualEscalationReviewStore();
  const item = newManualEscalationReview("code-688", "title-937");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
