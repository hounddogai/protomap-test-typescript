import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleAdjustmentStore } from "./bid-rule-adjustment-store.js";
import { newBidRuleAdjustment } from "./bid-rule-adjustment.js";

test("MemoryBidRuleAdjustmentStore finds what it saved", () => {
  const store = newMemoryBidRuleAdjustmentStore();
  const item = newBidRuleAdjustment("code-94", "name-273");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
