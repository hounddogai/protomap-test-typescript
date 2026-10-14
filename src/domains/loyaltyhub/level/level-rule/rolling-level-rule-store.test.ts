import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingLevelRuleStore } from "./rolling-level-rule-store.js";
import { newRollingLevelRule } from "./rolling-level-rule.js";

test("MemoryRollingLevelRuleStore finds what it saved", () => {
  const store = newMemoryRollingLevelRuleStore();
  const item = newRollingLevelRule("code-731", "name-550");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
