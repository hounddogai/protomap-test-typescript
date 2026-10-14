import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalPreferenceThresholdView,
  toSeasonalPreferenceThresholdViews,
} from "./seasonal-preference-threshold-view.js";
import { newSeasonalPreferenceThreshold } from "./seasonal-preference-threshold.js";

test("SeasonalPreferenceThresholdView shows the status in capitals", () => {
  const item = newSeasonalPreferenceThreshold("code-720", "label-399");
  const view = toSeasonalPreferenceThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalPreferenceThresholdViews([item, item]).length, 2, "views");
});
