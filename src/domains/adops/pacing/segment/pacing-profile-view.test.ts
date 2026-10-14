import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingProfileView, toPacingProfileViews } from "./pacing-profile-view.js";
import { newPacingProfile } from "./pacing-profile.js";

test("PacingProfileView shows the status in capitals", () => {
  const item = newPacingProfile("code-197", "title-648");
  const view = toPacingProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingProfileViews([item, item]).length, 2, "views");
});
