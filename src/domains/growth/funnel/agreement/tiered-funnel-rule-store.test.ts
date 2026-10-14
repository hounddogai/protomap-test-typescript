import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredFunnelRuleStore } from "./tiered-funnel-rule-store.js";
import { newTieredFunnelRule } from "./tiered-funnel-rule.js";

test("MemoryTieredFunnelRuleStore finds what it saved", () => {
  const store = newMemoryTieredFunnelRuleStore();
  const item = newTieredFunnelRule("code-701", "title-353");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
