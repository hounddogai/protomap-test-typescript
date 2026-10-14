import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientBidRuleAdjustmentStore } from "./lenient-bid-rule-adjustment-store.js";
import { newLenientBidRuleAdjustment } from "./lenient-bid-rule-adjustment.js";

test("MemoryLenientBidRuleAdjustmentStore finds what it saved", () => {
  const store = newMemoryLenientBidRuleAdjustmentStore();
  const item = newLenientBidRuleAdjustment("code-859", "title-471");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
