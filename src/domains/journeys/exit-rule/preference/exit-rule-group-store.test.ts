import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleGroupStore } from "./exit-rule-group-store.js";
import { newExitRuleGroup } from "./exit-rule-group.js";

test("MemoryExitRuleGroupStore finds what it saved", () => {
  const store = newMemoryExitRuleGroupStore();
  const item = newExitRuleGroup("code-60", "name-466");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
