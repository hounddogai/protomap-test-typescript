import assert from "node:assert/strict";
import { test } from "node:test";
import { toEscalationMilestoneView, toEscalationMilestoneViews } from "./escalation-milestone-view.js";
import { newEscalationMilestone } from "./escalation-milestone.js";

test("EscalationMilestoneView shows the status in capitals", () => {
  const item = newEscalationMilestone("code-7", "name-286");
  const view = toEscalationMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEscalationMilestoneViews([item, item]).length, 2, "views");
});
