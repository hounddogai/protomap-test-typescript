import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatThresholdView, toCsatThresholdViews } from "./csat-threshold-view.js";
import { newCsatThreshold } from "./csat-threshold.js";

test("CsatThresholdView shows the status in capitals", () => {
  const item = newCsatThreshold("code-423", "name-284");
  const view = toCsatThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatThresholdViews([item, item]).length, 2, "views");
});
