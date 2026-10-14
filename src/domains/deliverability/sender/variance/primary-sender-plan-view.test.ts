import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimarySenderPlanView, toPrimarySenderPlanViews } from "./primary-sender-plan-view.js";
import { newPrimarySenderPlan } from "./primary-sender-plan.js";

test("PrimarySenderPlanView shows the status in capitals", () => {
  const item = newPrimarySenderPlan("code-920", "label-110");
  const view = toPrimarySenderPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimarySenderPlanViews([item, item]).length, 2, "views");
});
