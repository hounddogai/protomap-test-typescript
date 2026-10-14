import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyFrequencyTargetView, toLegacyFrequencyTargetViews } from "./legacy-frequency-target-view.js";
import { newLegacyFrequencyTarget } from "./legacy-frequency-target.js";

test("LegacyFrequencyTargetView shows the status in capitals", () => {
  const item = newLegacyFrequencyTarget("code-12", "name-813");
  const view = toLegacyFrequencyTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyFrequencyTargetViews([item, item]).length, 2, "views");
});
