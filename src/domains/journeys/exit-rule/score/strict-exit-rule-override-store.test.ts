import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictExitRuleOverrideStore } from "./strict-exit-rule-override-store.js";
import { newStrictExitRuleOverride } from "./strict-exit-rule-override.js";

test("MemoryStrictExitRuleOverrideStore finds what it saved", () => {
  const store = newMemoryStrictExitRuleOverrideStore();
  const item = newStrictExitRuleOverride("code-970", "label-752");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
