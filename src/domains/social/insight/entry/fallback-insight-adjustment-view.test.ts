import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackInsightAdjustmentView,
  toFallbackInsightAdjustmentViews,
} from "./fallback-insight-adjustment-view.js";
import { newFallbackInsightAdjustment } from "./fallback-insight-adjustment.js";

test("FallbackInsightAdjustmentView shows the status in capitals", () => {
  const item = newFallbackInsightAdjustment("code-345", "name-231");
  const view = toFallbackInsightAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackInsightAdjustmentViews([item, item]).length, 2, "views");
});
