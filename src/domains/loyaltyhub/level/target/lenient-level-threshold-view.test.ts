import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientLevelThresholdView, toLenientLevelThresholdViews } from "./lenient-level-threshold-view.js";
import { newLenientLevelThreshold } from "./lenient-level-threshold.js";

test("LenientLevelThresholdView shows the status in capitals", () => {
  const item = newLenientLevelThreshold("code-370", "title-320");
  const view = toLenientLevelThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientLevelThresholdViews([item, item]).length, 2, "views");
});
