import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleMappingStore } from "./exit-rule-mapping-store.js";
import { newExitRuleMapping } from "./exit-rule-mapping.js";

test("MemoryExitRuleMappingStore finds what it saved", () => {
  const store = newMemoryExitRuleMappingStore();
  const item = newExitRuleMapping("code-4", "title-120");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
