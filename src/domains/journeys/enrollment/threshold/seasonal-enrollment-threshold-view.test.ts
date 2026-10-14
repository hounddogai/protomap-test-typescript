import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalEnrollmentThresholdView,
  toSeasonalEnrollmentThresholdViews,
} from "./seasonal-enrollment-threshold-view.js";
import { newSeasonalEnrollmentThreshold } from "./seasonal-enrollment-threshold.js";

test("SeasonalEnrollmentThresholdView shows the status in capitals", () => {
  const item = newSeasonalEnrollmentThreshold("code-230", "label-900");
  const view = toSeasonalEnrollmentThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalEnrollmentThresholdViews([item, item]).length, 2, "views");
});
