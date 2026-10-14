import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationEstimateView, toReputationEstimateViews } from "./reputation-estimate-view.js";
import { newReputationEstimate } from "./reputation-estimate.js";

test("ReputationEstimateView shows the status in capitals", () => {
  const item = newReputationEstimate("code-60", "title-283");
  const view = toReputationEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationEstimateViews([item, item]).length, 2, "views");
});
