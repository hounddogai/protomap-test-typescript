import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalInviteMilestoneView, toSeasonalInviteMilestoneViews } from "./seasonal-invite-milestone-view.js";
import { newSeasonalInviteMilestone } from "./seasonal-invite-milestone.js";

test("SeasonalInviteMilestoneView shows the status in capitals", () => {
  const item = newSeasonalInviteMilestone("code-821", "title-98");
  const view = toSeasonalInviteMilestoneView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalInviteMilestoneViews([item, item]).length, 2, "views");
});
