import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelRuleStore } from "./funnel-rule-store.js";
import { newFunnelRule } from "./funnel-rule.js";

test("MemoryFunnelRuleStore finds what it saved", () => {
  const store = newMemoryFunnelRuleStore();
  const item = newFunnelRule("code-764", "title-520");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
