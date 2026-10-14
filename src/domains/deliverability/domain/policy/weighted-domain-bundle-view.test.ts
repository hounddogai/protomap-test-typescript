import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedDomainBundleView, toWeightedDomainBundleViews } from "./weighted-domain-bundle-view.js";
import { newWeightedDomainBundle } from "./weighted-domain-bundle.js";

test("WeightedDomainBundleView shows the status in capitals", () => {
  const item = newWeightedDomainBundle("code-673", "title-704");
  const view = toWeightedDomainBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedDomainBundleViews([item, item]).length, 2, "views");
});
