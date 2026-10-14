import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierRuleStore } from "./tier-rule-store.js";
import { newTierRule } from "./tier-rule.js";

test("MemoryTierRuleStore finds what it saved", () => {
  const store = newMemoryTierRuleStore();
  const item = newTierRule("code-50", "label-535");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
