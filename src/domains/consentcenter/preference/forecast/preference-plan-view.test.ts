import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferencePlanView, toPreferencePlanViews } from "./preference-plan-view.js";
import { newPreferencePlan } from "./preference-plan.js";

test("PreferencePlanView shows the status in capitals", () => {
  const item = newPreferencePlan("code-886", "label-120");
  const view = toPreferencePlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferencePlanViews([item, item]).length, 2, "views");
});
