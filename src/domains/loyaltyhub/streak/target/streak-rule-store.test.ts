import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStreakRuleStore } from "./streak-rule-store.js";
import { newStreakRule } from "./streak-rule.js";

test("MemoryStreakRuleStore finds what it saved", () => {
  const store = newMemoryStreakRuleStore();
  const item = newStreakRule("code-470", "label-975");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
