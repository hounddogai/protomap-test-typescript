import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalSuppressionBundleView,
  toSeasonalSuppressionBundleViews,
} from "./seasonal-suppression-bundle-view.js";
import { newSeasonalSuppressionBundle } from "./seasonal-suppression-bundle.js";

test("SeasonalSuppressionBundleView shows the status in capitals", () => {
  const item = newSeasonalSuppressionBundle("code-946", "label-48");
  const view = toSeasonalSuppressionBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalSuppressionBundleViews([item, item]).length, 2, "views");
});
