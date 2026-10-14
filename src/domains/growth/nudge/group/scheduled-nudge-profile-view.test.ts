import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledNudgeProfileView, toScheduledNudgeProfileViews } from "./scheduled-nudge-profile-view.js";
import { newScheduledNudgeProfile } from "./scheduled-nudge-profile.js";

test("ScheduledNudgeProfileView shows the status in capitals", () => {
  const item = newScheduledNudgeProfile("code-978", "label-840");
  const view = toScheduledNudgeProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledNudgeProfileViews([item, item]).length, 2, "views");
});
