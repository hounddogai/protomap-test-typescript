import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictSlaMilestoneView, toStrictSlaMilestoneViews } from "./strict-sla-milestone-view.js";
import { newStrictSlaMilestone } from "./strict-sla-milestone.js";

test("StrictSlaMilestoneView shows the status in capitals", () => {
  const item = newStrictSlaMilestone("code-151", "name-275");
  const view = toStrictSlaMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictSlaMilestoneViews([item, item]).length, 2, "views");
});
