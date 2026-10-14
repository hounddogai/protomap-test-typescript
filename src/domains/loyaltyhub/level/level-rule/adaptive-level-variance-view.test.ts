import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveLevelVarianceView, toAdaptiveLevelVarianceViews } from "./adaptive-level-variance-view.js";
import { newAdaptiveLevelVariance } from "./adaptive-level-variance.js";

test("AdaptiveLevelVarianceView shows the status in capitals", () => {
  const item = newAdaptiveLevelVariance("code-400", "label-770");
  const view = toAdaptiveLevelVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveLevelVarianceViews([item, item]).length, 2, "views");
});
