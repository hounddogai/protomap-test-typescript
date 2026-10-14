import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderPlanView, toSenderPlanViews } from "./sender-plan-view.js";
import { newSenderPlan } from "./sender-plan.js";

test("SenderPlanView shows the status in capitals", () => {
  const item = newSenderPlan("code-325", "title-458");
  const view = toSenderPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderPlanViews([item, item]).length, 2, "views");
});
