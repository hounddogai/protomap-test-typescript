import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierVarianceView, toTierVarianceViews } from "./tier-variance-view.js";
import { newTierVariance } from "./tier-variance.js";

test("TierVarianceView shows the status in capitals", () => {
  const item = newTierVariance("code-126", "name-60");
  const view = toTierVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierVarianceViews([item, item]).length, 2, "views");
});
