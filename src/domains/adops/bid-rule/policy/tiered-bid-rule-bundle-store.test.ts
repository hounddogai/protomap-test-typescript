import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredBidRuleBundleStore } from "./tiered-bid-rule-bundle-store.js";
import { newTieredBidRuleBundle } from "./tiered-bid-rule-bundle.js";

test("MemoryTieredBidRuleBundleStore finds what it saved", () => {
  const store = newMemoryTieredBidRuleBundleStore();
  const item = newTieredBidRuleBundle("code-154", "name-960");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
