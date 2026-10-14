import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyPlanView, toJourneyPlanViews } from "./journey-plan-view.js";
import { newJourneyPlan } from "./journey-plan.js";

test("JourneyPlanView shows the status in capitals", () => {
  const item = newJourneyPlan("code-890", "title-903");
  const view = toJourneyPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyPlanViews([item, item]).length, 2, "views");
});
