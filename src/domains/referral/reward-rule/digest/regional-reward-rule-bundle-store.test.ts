import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalRewardRuleBundleStore } from "./regional-reward-rule-bundle-store.js";
import { newRegionalRewardRuleBundle } from "./regional-reward-rule-bundle.js";

test("MemoryRegionalRewardRuleBundleStore finds what it saved", () => {
  const store = newMemoryRegionalRewardRuleBundleStore();
  const item = newRegionalRewardRuleBundle("code-641", "label-162");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
