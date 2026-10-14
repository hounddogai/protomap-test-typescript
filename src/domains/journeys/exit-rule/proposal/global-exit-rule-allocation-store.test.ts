import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalExitRuleAllocationStore } from "./global-exit-rule-allocation-store.js";
import { newGlobalExitRuleAllocation } from "./global-exit-rule-allocation.js";

test("MemoryGlobalExitRuleAllocationStore finds what it saved", () => {
  const store = newMemoryGlobalExitRuleAllocationStore();
  const item = newGlobalExitRuleAllocation("code-892", "label-9");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
