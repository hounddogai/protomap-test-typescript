import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalExitRuleTargetStore } from "./regional-exit-rule-target-store.js";
import { newRegionalExitRuleTarget } from "./regional-exit-rule-target.js";

test("MemoryRegionalExitRuleTargetStore finds what it saved", () => {
  const store = newMemoryRegionalExitRuleTargetStore();
  const item = newRegionalExitRuleTarget("code-615", "label-694");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
