import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalFunnelReviewStore } from "./regional-funnel-review-store.js";
import { newRegionalFunnelReview } from "./regional-funnel-review.js";

test("MemoryRegionalFunnelReviewStore finds what it saved", () => {
  const store = newMemoryRegionalFunnelReviewStore();
  const item = newRegionalFunnelReview("code-328", "title-897");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
