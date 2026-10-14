import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowPlanStore } from "./window-plan-store.js";
import { newWindowPlan } from "./window-plan.js";

test("MemoryWindowPlanStore finds what it saved", () => {
  const store = newMemoryWindowPlanStore();
  const item = newWindowPlan("code-112", "label-928");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
