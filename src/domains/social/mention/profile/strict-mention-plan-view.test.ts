import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictMentionPlanView, toStrictMentionPlanViews } from "./strict-mention-plan-view.js";
import { newStrictMentionPlan } from "./strict-mention-plan.js";

test("StrictMentionPlanView shows the status in capitals", () => {
  const item = newStrictMentionPlan("code-951", "label-766");
  const view = toStrictMentionPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictMentionPlanViews([item, item]).length, 2, "views");
});
