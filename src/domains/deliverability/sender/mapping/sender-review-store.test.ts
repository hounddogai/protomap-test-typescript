import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderReviewStore } from "./sender-review-store.js";
import { newSenderReview } from "./sender-review.js";

test("MemorySenderReviewStore finds what it saved", () => {
  const store = newMemorySenderReviewStore();
  const item = newSenderReview("code-590", "name-429");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
