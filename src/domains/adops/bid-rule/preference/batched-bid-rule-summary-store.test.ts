import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedBidRuleSummaryStore } from "./batched-bid-rule-summary-store.js";
import { newBatchedBidRuleSummary } from "./batched-bid-rule-summary.js";

test("MemoryBatchedBidRuleSummaryStore finds what it saved", () => {
  const store = newMemoryBatchedBidRuleSummaryStore();
  const item = newBatchedBidRuleSummary("code-377", "name-565");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
