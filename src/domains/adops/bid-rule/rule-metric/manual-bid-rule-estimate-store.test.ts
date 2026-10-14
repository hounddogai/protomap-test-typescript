import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualBidRuleEstimateStore } from "./manual-bid-rule-estimate-store.js";
import { newManualBidRuleEstimate } from "./manual-bid-rule-estimate.js";

test("MemoryManualBidRuleEstimateStore finds what it saved", () => {
  const store = newMemoryManualBidRuleEstimateStore();
  const item = newManualBidRuleEstimate("code-71", "title-111");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
