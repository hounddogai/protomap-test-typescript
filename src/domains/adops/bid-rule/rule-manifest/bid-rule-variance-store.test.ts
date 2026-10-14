import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleVarianceStore } from "./bid-rule-variance-store.js";
import { newBidRuleVariance } from "./bid-rule-variance.js";

test("MemoryBidRuleVarianceStore finds what it saved", () => {
  const store = newMemoryBidRuleVarianceStore();
  const item = newBidRuleVariance("code-761", "title-230");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
