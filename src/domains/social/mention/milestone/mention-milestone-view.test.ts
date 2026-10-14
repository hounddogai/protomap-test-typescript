import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionMilestoneView, toMentionMilestoneViews } from "./mention-milestone-view.js";
import { newMentionMilestone } from "./mention-milestone.js";

test("MentionMilestoneView shows the status in capitals", () => {
  const item = newMentionMilestone("code-380", "label-215");
  const view = toMentionMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionMilestoneViews([item, item]).length, 2, "views");
});
