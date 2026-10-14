import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingBidRuleVarianceStore } from "./pending-bid-rule-variance-store.js";
import { newPendingBidRuleVariance } from "./pending-bid-rule-variance.js";

test("MemoryPendingBidRuleVarianceStore finds what it saved", () => {
  const store = newMemoryPendingBidRuleVarianceStore();
  const item = newPendingBidRuleVariance("code-121", "title-871");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
