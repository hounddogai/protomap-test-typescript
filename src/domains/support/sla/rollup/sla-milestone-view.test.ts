import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaMilestoneView, toSlaMilestoneViews } from "./sla-milestone-view.js";
import { newSlaMilestone } from "./sla-milestone.js";

test("SlaMilestoneView shows the status in capitals", () => {
  const item = newSlaMilestone("code-853", "name-454");
  const view = toSlaMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaMilestoneViews([item, item]).length, 2, "views");
});
