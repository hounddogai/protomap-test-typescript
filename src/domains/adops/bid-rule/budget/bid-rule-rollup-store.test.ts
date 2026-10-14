import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleRollupStore } from "./bid-rule-rollup-store.js";
import { newBidRuleRollup } from "./bid-rule-rollup.js";

test("MemoryBidRuleRollupStore finds what it saved", () => {
  const store = newMemoryBidRuleRollupStore();
  const item = newBidRuleRollup("code-126", "label-995");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
