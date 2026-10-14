import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleBundleStore } from "./bid-rule-bundle-store.js";
import { newBidRuleBundle } from "./bid-rule-bundle.js";

test("MemoryBidRuleBundleStore finds what it saved", () => {
  const store = newMemoryBidRuleBundleStore();
  const item = newBidRuleBundle("code-759", "label-178");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
