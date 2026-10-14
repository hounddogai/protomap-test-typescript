import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedExitRuleMappingStore } from "./batched-exit-rule-mapping-store.js";
import { newBatchedExitRuleMapping } from "./batched-exit-rule-mapping.js";

test("MemoryBatchedExitRuleMappingStore finds what it saved", () => {
  const store = newMemoryBatchedExitRuleMappingStore();
  const item = newBatchedExitRuleMapping("code-523", "label-906");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
