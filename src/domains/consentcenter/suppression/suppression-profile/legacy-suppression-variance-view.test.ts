import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLegacySuppressionVarianceView,
  toLegacySuppressionVarianceViews,
} from "./legacy-suppression-variance-view.js";
import { newLegacySuppressionVariance } from "./legacy-suppression-variance.js";

test("LegacySuppressionVarianceView shows the status in capitals", () => {
  const item = newLegacySuppressionVariance("code-921", "title-417");
  const view = toLegacySuppressionVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacySuppressionVarianceViews([item, item]).length, 2, "views");
});
