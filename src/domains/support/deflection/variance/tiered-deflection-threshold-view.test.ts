import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredDeflectionThresholdView,
  toTieredDeflectionThresholdViews,
} from "./tiered-deflection-threshold-view.js";
import { newTieredDeflectionThreshold } from "./tiered-deflection-threshold.js";

test("TieredDeflectionThresholdView shows the status in capitals", () => {
  const item = newTieredDeflectionThreshold("code-49", "label-599");
  const view = toTieredDeflectionThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredDeflectionThresholdViews([item, item]).length, 2, "views");
});
