import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackRewardRuleBundleStore } from "./fallback-reward-rule-bundle-store.js";
import { newFallbackRewardRuleBundle } from "./fallback-reward-rule-bundle.js";

test("MemoryFallbackRewardRuleBundleStore finds what it saved", () => {
  const store = newMemoryFallbackRewardRuleBundleStore();
  const item = newFallbackRewardRuleBundle("code-274", "title-239");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
