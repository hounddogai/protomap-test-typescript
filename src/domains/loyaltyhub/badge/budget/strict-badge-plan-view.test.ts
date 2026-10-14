import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictBadgePlanView, toStrictBadgePlanViews } from "./strict-badge-plan-view.js";
import { newStrictBadgePlan } from "./strict-badge-plan.js";

test("StrictBadgePlanView shows the status in capitals", () => {
  const item = newStrictBadgePlan("code-441", "label-38");
  const view = toStrictBadgePlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictBadgePlanViews([item, item]).length, 2, "views");
});
