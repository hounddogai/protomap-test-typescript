import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierBundleView, toTierBundleViews } from "./tier-bundle-view.js";
import { newTierBundle } from "./tier-bundle.js";

test("TierBundleView shows the status in capitals", () => {
  const item = newTierBundle("code-847", "name-25");
  const view = toTierBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierBundleViews([item, item]).length, 2, "views");
});
