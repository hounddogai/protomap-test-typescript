import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewPlanStore } from "./ticket-view-plan-store.js";
import { newTicketViewPlan } from "./ticket-view-plan.js";

test("MemoryTicketViewPlanStore finds what it saved", () => {
  const store = newMemoryTicketViewPlanStore();
  const item = newTicketViewPlan("code-102", "name-833");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
