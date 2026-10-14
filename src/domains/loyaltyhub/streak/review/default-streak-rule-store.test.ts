import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultStreakRuleStore } from "./default-streak-rule-store.js";
import { newDefaultStreakRule } from "./default-streak-rule.js";

test("MemoryDefaultStreakRuleStore finds what it saved", () => {
  const store = newMemoryDefaultStreakRuleStore();
  const item = newDefaultStreakRule("code-527", "label-620");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
