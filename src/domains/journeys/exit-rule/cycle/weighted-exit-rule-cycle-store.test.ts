import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedExitRuleCycleStore } from "./weighted-exit-rule-cycle-store.js";
import { newWeightedExitRuleCycle } from "./weighted-exit-rule-cycle.js";

test("MemoryWeightedExitRuleCycleStore finds what it saved", () => {
  const store = newMemoryWeightedExitRuleCycleStore();
  const item = newWeightedExitRuleCycle("code-240", "title-355");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
