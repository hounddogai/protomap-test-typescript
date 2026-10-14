import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toGlobalSuppressionVarianceView,
  toGlobalSuppressionVarianceViews,
} from "./global-suppression-variance-view.js";
import { newGlobalSuppressionVariance } from "./global-suppression-variance.js";

test("GlobalSuppressionVarianceView shows the status in capitals", () => {
  const item = newGlobalSuppressionVariance("code-997", "label-826");
  const view = toGlobalSuppressionVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalSuppressionVarianceViews([item, item]).length, 2, "views");
});
