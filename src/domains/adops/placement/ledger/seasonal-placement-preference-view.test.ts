import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalPlacementPreferenceView,
  toSeasonalPlacementPreferenceViews,
} from "./seasonal-placement-preference-view.js";
import { newSeasonalPlacementPreference } from "./seasonal-placement-preference.js";

test("SeasonalPlacementPreferenceView shows the status in capitals", () => {
  const item = newSeasonalPlacementPreference("code-758", "title-69");
  const view = toSeasonalPlacementPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalPlacementPreferenceViews([item, item]).length, 2, "views");
});
