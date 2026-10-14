import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionReviewStore } from "./conversion-review-store.js";
import { newConversionReview } from "./conversion-review.js";

test("MemoryConversionReviewStore finds what it saved", () => {
  const store = newMemoryConversionReviewStore();
  const item = newConversionReview("code-524", "label-68");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
