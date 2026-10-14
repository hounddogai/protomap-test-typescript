import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewPlanView, toTicketViewPlanViews } from "./ticket-view-plan-view.js";
import { newTicketViewPlan } from "./ticket-view-plan.js";

test("TicketViewPlanView shows the status in capitals", () => {
  const item = newTicketViewPlan("code-102", "name-833");
  const view = toTicketViewPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewPlanViews([item, item]).length, 2, "views");
});
