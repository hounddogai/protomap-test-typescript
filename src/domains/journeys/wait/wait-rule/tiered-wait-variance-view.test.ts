import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredWaitVarianceView, toTieredWaitVarianceViews } from "./tiered-wait-variance-view.js";
import { newTieredWaitVariance } from "./tiered-wait-variance.js";

test("TieredWaitVarianceView shows the status in capitals", () => {
  const item = newTieredWaitVariance("code-202", "name-834");
  const view = toTieredWaitVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredWaitVarianceViews([item, item]).length, 2, "views");
});
