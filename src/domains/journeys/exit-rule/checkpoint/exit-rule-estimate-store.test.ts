import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleEstimateStore } from "./exit-rule-estimate-store.js";
import { newExitRuleEstimate } from "./exit-rule-estimate.js";

test("MemoryExitRuleEstimateStore finds what it saved", () => {
  const store = newMemoryExitRuleEstimateStore();
  const item = newExitRuleEstimate("code-153", "name-310");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
