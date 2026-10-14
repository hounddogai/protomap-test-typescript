import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingCsatRuleStore } from "./rolling-csat-rule-store.js";
import { newRollingCsatRule } from "./rolling-csat-rule.js";

test("MemoryRollingCsatRuleStore finds what it saved", () => {
  const store = newMemoryRollingCsatRuleStore();
  const item = newRollingCsatRule("code-258", "name-721");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
