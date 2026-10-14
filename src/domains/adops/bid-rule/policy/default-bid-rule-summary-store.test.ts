import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultBidRuleSummaryStore } from "./default-bid-rule-summary-store.js";
import { newDefaultBidRuleSummary } from "./default-bid-rule-summary.js";

test("MemoryDefaultBidRuleSummaryStore finds what it saved", () => {
  const store = newMemoryDefaultBidRuleSummaryStore();
  const item = newDefaultBidRuleSummary("code-244", "label-869");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
