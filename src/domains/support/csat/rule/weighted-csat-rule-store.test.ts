import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedCsatRuleStore } from "./weighted-csat-rule-store.js";
import { newWeightedCsatRule } from "./weighted-csat-rule.js";

test("MemoryWeightedCsatRuleStore finds what it saved", () => {
  const store = newMemoryWeightedCsatRuleStore();
  const item = newWeightedCsatRule("code-88", "name-670");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
