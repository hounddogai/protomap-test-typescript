import assert from "node:assert/strict";
import { test } from "node:test";
import { toProofPlanView, toProofPlanViews } from "./proof-plan-view.js";
import { newProofPlan } from "./proof-plan.js";

test("ProofPlanView shows the status in capitals", () => {
  const item = newProofPlan("code-295", "title-35");
  const view = toProofPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toProofPlanViews([item, item]).length, 2, "views");
});
