import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDomainPlanStore } from "./domain-plan-store.js";
import { newDomainPlan } from "./domain-plan.js";

test("MemoryDomainPlanStore finds what it saved", () => {
  const store = newMemoryDomainPlanStore();
  const item = newDomainPlan("code-271", "title-502");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
