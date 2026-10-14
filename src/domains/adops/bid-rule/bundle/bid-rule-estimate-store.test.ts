import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleEstimateStore } from "./bid-rule-estimate-store.js";
import { newBidRuleEstimate } from "./bid-rule-estimate.js";

test("MemoryBidRuleEstimateStore finds what it saved", () => {
  const store = newMemoryBidRuleEstimateStore();
  const item = newBidRuleEstimate("code-568", "name-461");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
