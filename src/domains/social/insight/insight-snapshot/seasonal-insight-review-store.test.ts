import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalInsightReviewStore } from "./seasonal-insight-review-store.js";
import { newSeasonalInsightReview } from "./seasonal-insight-review.js";

test("MemorySeasonalInsightReviewStore finds what it saved", () => {
  const store = newMemorySeasonalInsightReviewStore();
  const item = newSeasonalInsightReview("code-676", "label-900");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
