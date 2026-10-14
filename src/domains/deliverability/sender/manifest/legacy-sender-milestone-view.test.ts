import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacySenderMilestoneView, toLegacySenderMilestoneViews } from "./legacy-sender-milestone-view.js";
import { newLegacySenderMilestone } from "./legacy-sender-milestone.js";

test("LegacySenderMilestoneView shows the status in capitals", () => {
  const item = newLegacySenderMilestone("code-416", "label-703");
  const view = toLegacySenderMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacySenderMilestoneViews([item, item]).length, 2, "views");
});
