import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyCreditThresholdView, toLegacyCreditThresholdViews } from "./legacy-credit-threshold-view.js";
import { newLegacyCreditThreshold } from "./legacy-credit-threshold.js";

test("LegacyCreditThresholdView shows the status in capitals", () => {
  const item = newLegacyCreditThreshold("code-103", "title-58");
  const view = toLegacyCreditThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyCreditThresholdViews([item, item]).length, 2, "views");
});
