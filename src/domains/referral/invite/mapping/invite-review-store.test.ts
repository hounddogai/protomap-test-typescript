import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteReviewStore } from "./invite-review-store.js";
import { newInviteReview } from "./invite-review.js";

test("MemoryInviteReviewStore finds what it saved", () => {
  const store = newMemoryInviteReviewStore();
  const item = newInviteReview("code-172", "title-496");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
