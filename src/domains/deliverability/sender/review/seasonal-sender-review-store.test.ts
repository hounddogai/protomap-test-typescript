import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalSenderReviewStore } from "./seasonal-sender-review-store.js";
import { newSeasonalSenderReview } from "./seasonal-sender-review.js";

test("MemorySeasonalSenderReviewStore finds what it saved", () => {
  const store = newMemorySeasonalSenderReviewStore();
  const item = newSeasonalSenderReview("code-657", "title-968");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
