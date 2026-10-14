import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledSlaPlanView, toScheduledSlaPlanViews } from "./scheduled-sla-plan-view.js";
import { newScheduledSlaPlan } from "./scheduled-sla-plan.js";

test("ScheduledSlaPlanView shows the status in capitals", () => {
  const item = newScheduledSlaPlan("code-936", "name-904");
  const view = toScheduledSlaPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledSlaPlanViews([item, item]).length, 2, "views");
});
