import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackBidRuleOverrideStore } from "./fallback-bid-rule-override-store.js";
import { newFallbackBidRuleOverride } from "./fallback-bid-rule-override.js";

test("MemoryFallbackBidRuleOverrideStore finds what it saved", () => {
  const store = newMemoryFallbackBidRuleOverrideStore();
  const item = newFallbackBidRuleOverride("code-829", "label-927");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
