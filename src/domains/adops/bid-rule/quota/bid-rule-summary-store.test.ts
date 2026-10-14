import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleSummaryStore } from "./bid-rule-summary-store.js";
import { newBidRuleSummary } from "./bid-rule-summary.js";

test("MemoryBidRuleSummaryStore finds what it saved", () => {
  const store = newMemoryBidRuleSummaryStore();
  const item = newBidRuleSummary("code-867", "name-2");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
