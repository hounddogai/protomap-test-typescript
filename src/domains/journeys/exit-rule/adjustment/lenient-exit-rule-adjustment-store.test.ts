import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientExitRuleAdjustmentStore } from "./lenient-exit-rule-adjustment-store.js";
import { newLenientExitRuleAdjustment } from "./lenient-exit-rule-adjustment.js";

test("MemoryLenientExitRuleAdjustmentStore finds what it saved", () => {
  const store = newMemoryLenientExitRuleAdjustmentStore();
  const item = newLenientExitRuleAdjustment("code-903", "title-482");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
