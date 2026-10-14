import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualTierRuleStore } from "./manual-tier-rule-store.js";
import { newManualTierRule } from "./manual-tier-rule.js";

test("MemoryManualTierRuleStore finds what it saved", () => {
  const store = newMemoryManualTierRuleStore();
  const item = newManualTierRule("code-680", "label-732");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
