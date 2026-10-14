import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyPacingPlanView, toLegacyPacingPlanViews } from "./legacy-pacing-plan-view.js";
import { newLegacyPacingPlan } from "./legacy-pacing-plan.js";

test("LegacyPacingPlanView shows the status in capitals", () => {
  const item = newLegacyPacingPlan("code-309", "label-911");
  const view = toLegacyPacingPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyPacingPlanViews([item, item]).length, 2, "views");
});
