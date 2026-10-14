import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredModelVarianceView, toTieredModelVarianceViews } from "./tiered-model-variance-view.js";
import { newTieredModelVariance } from "./tiered-model-variance.js";

test("TieredModelVarianceView shows the status in capitals", () => {
  const item = newTieredModelVariance("code-981", "title-208");
  const view = toTieredModelVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredModelVarianceViews([item, item]).length, 2, "views");
});
