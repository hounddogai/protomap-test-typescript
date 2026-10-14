import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedBidRuleOverrideStore } from "./capped-bid-rule-override-store.js";
import { newCappedBidRuleOverride } from "./capped-bid-rule-override.js";

test("MemoryCappedBidRuleOverrideStore finds what it saved", () => {
  const store = newMemoryCappedBidRuleOverrideStore();
  const item = newCappedBidRuleOverride("code-638", "name-506");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
