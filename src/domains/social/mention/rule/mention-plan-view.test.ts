import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionPlanView, toMentionPlanViews } from "./mention-plan-view.js";
import { newMentionPlan } from "./mention-plan.js";

test("MentionPlanView shows the status in capitals", () => {
  const item = newMentionPlan("code-541", "label-349");
  const view = toMentionPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionPlanViews([item, item]).length, 2, "views");
});
