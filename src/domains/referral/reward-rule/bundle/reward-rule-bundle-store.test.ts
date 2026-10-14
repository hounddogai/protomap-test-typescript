import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleBundleStore } from "./reward-rule-bundle-store.js";
import { newRewardRuleBundle } from "./reward-rule-bundle.js";

test("MemoryRewardRuleBundleStore finds what it saved", () => {
  const store = newMemoryRewardRuleBundleStore();
  const item = newRewardRuleBundle("code-11", "name-220");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
