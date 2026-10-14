import assert from "node:assert/strict";
import { test } from "node:test";
import { toNudgeProfileView, toNudgeProfileViews } from "./nudge-profile-view.js";
import { newNudgeProfile } from "./nudge-profile.js";

test("NudgeProfileView shows the status in capitals", () => {
  const item = newNudgeProfile("code-505", "name-98");
  const view = toNudgeProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toNudgeProfileViews([item, item]).length, 2, "views");
});
