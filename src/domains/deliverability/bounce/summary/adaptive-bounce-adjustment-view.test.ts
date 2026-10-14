import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveBounceAdjustmentView,
  toAdaptiveBounceAdjustmentViews,
} from "./adaptive-bounce-adjustment-view.js";
import { newAdaptiveBounceAdjustment } from "./adaptive-bounce-adjustment.js";

test("AdaptiveBounceAdjustmentView shows the status in capitals", () => {
  const item = newAdaptiveBounceAdjustment("code-575", "label-713");
  const view = toAdaptiveBounceAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveBounceAdjustmentViews([item, item]).length, 2, "views");
});
