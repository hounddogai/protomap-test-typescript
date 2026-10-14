import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedFunnelTargetView, toWeightedFunnelTargetViews } from "./weighted-funnel-target-view.js";
import { newWeightedFunnelTarget } from "./weighted-funnel-target.js";

test("WeightedFunnelTargetView shows the status in capitals", () => {
  const item = newWeightedFunnelTarget("code-856", "name-945");
  const view = toWeightedFunnelTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedFunnelTargetViews([item, item]).length, 2, "views");
});
