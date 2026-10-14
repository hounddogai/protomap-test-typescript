import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimarySenderPlanStore } from "./primary-sender-plan-store.js";
import { newPrimarySenderPlan } from "./primary-sender-plan.js";

test("MemoryPrimarySenderPlanStore finds what it saved", () => {
  const store = newMemoryPrimarySenderPlanStore();
  const item = newPrimarySenderPlan("code-920", "label-110");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
