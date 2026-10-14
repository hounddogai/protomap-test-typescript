import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderPlanStore } from "./sender-plan-store.js";
import { newSenderPlan } from "./sender-plan.js";

test("MemorySenderPlanStore finds what it saved", () => {
  const store = newMemorySenderPlanStore();
  const item = newSenderPlan("code-325", "title-458");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
