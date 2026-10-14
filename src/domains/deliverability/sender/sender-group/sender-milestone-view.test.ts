import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderMilestoneView, toSenderMilestoneViews } from "./sender-milestone-view.js";
import { newSenderMilestone } from "./sender-milestone.js";

test("SenderMilestoneView shows the status in capitals", () => {
  const item = newSenderMilestone("code-142", "label-459");
  const view = toSenderMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderMilestoneViews([item, item]).length, 2, "views");
});
