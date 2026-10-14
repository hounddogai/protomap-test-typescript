import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleAllocationStore } from "./bid-rule-allocation-store.js";
import { newBidRuleAllocation } from "./bid-rule-allocation.js";

test("MemoryBidRuleAllocationStore finds what it saved", () => {
  const store = newMemoryBidRuleAllocationStore();
  const item = newBidRuleAllocation("code-149", "title-60");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
