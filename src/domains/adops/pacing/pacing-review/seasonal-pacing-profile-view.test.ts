import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalPacingProfileView, toSeasonalPacingProfileViews } from "./seasonal-pacing-profile-view.js";
import { newSeasonalPacingProfile } from "./seasonal-pacing-profile.js";

test("SeasonalPacingProfileView shows the status in capitals", () => {
  const item = newSeasonalPacingProfile("code-457", "title-701");
  const view = toSeasonalPacingProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalPacingProfileViews([item, item]).length, 2, "views");
});
