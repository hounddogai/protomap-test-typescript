import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultBidRulePlanView, toDefaultBidRulePlanViews } from "./default-bid-rule-plan-view.js";
import { newDefaultBidRulePlan } from "./default-bid-rule-plan.js";

test("DefaultBidRulePlanView shows the status in capitals", () => {
  const item = newDefaultBidRulePlan("code-841", "name-201");
  const view = toDefaultBidRulePlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultBidRulePlanViews([item, item]).length, 2, "views");
});
