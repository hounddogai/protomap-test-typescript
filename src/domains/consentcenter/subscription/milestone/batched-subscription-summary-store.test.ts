import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedSubscriptionSummaryStore } from "./batched-subscription-summary-store.js";
import { newBatchedSubscriptionSummary } from "./batched-subscription-summary.js";

test("MemoryBatchedSubscriptionSummaryStore finds what it saved", () => {
  const store = newMemoryBatchedSubscriptionSummaryStore();
  const item = newBatchedSubscriptionSummary("code-568", "label-305");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
