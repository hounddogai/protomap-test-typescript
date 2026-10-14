import assert from "node:assert/strict";
import { test } from "node:test";
import { toActivationEstimateView, toActivationEstimateViews } from "./activation-estimate-view.js";
import { newActivationEstimate } from "./activation-estimate.js";

test("ActivationEstimateView shows the status in capitals", () => {
  const item = newActivationEstimate("code-894", "name-590");
  const view = toActivationEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toActivationEstimateViews([item, item]).length, 2, "views");
});
