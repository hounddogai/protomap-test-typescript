import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelThresholdView, toModelThresholdViews } from "./model-threshold-view.js";
import { newModelThreshold } from "./model-threshold.js";

test("ModelThresholdView shows the status in capitals", () => {
  const item = newModelThreshold("code-797", "label-321");
  const view = toModelThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelThresholdViews([item, item]).length, 2, "views");
});
