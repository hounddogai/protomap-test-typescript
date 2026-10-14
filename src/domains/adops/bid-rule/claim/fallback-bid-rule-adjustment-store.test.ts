import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackBidRuleAdjustmentStore } from "./fallback-bid-rule-adjustment-store.js";
import { newFallbackBidRuleAdjustment } from "./fallback-bid-rule-adjustment.js";

test("MemoryFallbackBidRuleAdjustmentStore finds what it saved", () => {
  const store = newMemoryFallbackBidRuleAdjustmentStore();
  const item = newFallbackBidRuleAdjustment("code-905", "title-779");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
