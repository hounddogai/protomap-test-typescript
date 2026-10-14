import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeMilestoneView, toChallengeMilestoneViews } from "./challenge-milestone-view.js";
import { newChallengeMilestone } from "./challenge-milestone.js";

test("ChallengeMilestoneView shows the status in capitals", () => {
  const item = newChallengeMilestone("code-39", "name-902");
  const view = toChallengeMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeMilestoneViews([item, item]).length, 2, "views");
});
