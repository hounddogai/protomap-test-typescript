import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualExitRuleBaselineStore } from "./manual-exit-rule-baseline-store.js";
import { newManualExitRuleBaseline } from "./manual-exit-rule-baseline.js";

test("MemoryManualExitRuleBaselineStore finds what it saved", () => {
  const store = newMemoryManualExitRuleBaselineStore();
  const item = newManualExitRuleBaseline("code-471", "name-927");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
