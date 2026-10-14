import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRulePolicyStore } from "./bid-rule-policy-store.js";
import { newBidRulePolicy } from "./bid-rule-policy.js";

test("MemoryBidRulePolicyStore finds what it saved", () => {
  const store = newMemoryBidRulePolicyStore();
  const item = newBidRulePolicy("code-526", "title-620");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
