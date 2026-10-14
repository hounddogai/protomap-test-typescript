import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualBidRuleBundleStore } from "./manual-bid-rule-bundle-store.js";
import { newManualBidRuleBundle } from "./manual-bid-rule-bundle.js";

test("MemoryManualBidRuleBundleStore finds what it saved", () => {
  const store = newMemoryManualBidRuleBundleStore();
  const item = newManualBidRuleBundle("code-799", "title-199");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
