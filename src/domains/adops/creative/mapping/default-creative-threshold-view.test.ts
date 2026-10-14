import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultCreativeThresholdView,
  toDefaultCreativeThresholdViews,
} from "./default-creative-threshold-view.js";
import { newDefaultCreativeThreshold } from "./default-creative-threshold.js";

test("DefaultCreativeThresholdView shows the status in capitals", () => {
  const item = newDefaultCreativeThreshold("code-252", "label-761");
  const view = toDefaultCreativeThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultCreativeThresholdViews([item, item]).length, 2, "views");
});
