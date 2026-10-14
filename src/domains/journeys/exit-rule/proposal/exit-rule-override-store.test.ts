import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleOverrideStore } from "./exit-rule-override-store.js";
import { newExitRuleOverride } from "./exit-rule-override.js";

test("MemoryExitRuleOverrideStore finds what it saved", () => {
  const store = newMemoryExitRuleOverrideStore();
  const item = newExitRuleOverride("code-448", "name-527");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
