import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalWarmupVarianceView, toRegionalWarmupVarianceViews } from "./regional-warmup-variance-view.js";
import { newRegionalWarmupVariance } from "./regional-warmup-variance.js";

test("RegionalWarmupVarianceView shows the status in capitals", () => {
  const item = newRegionalWarmupVariance("code-962", "title-880");
  const view = toRegionalWarmupVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalWarmupVarianceViews([item, item]).length, 2, "views");
});
