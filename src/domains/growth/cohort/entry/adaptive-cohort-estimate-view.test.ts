import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveCohortEstimateView, toAdaptiveCohortEstimateViews } from "./adaptive-cohort-estimate-view.js";
import { newAdaptiveCohortEstimate } from "./adaptive-cohort-estimate.js";

test("AdaptiveCohortEstimateView shows the status in capitals", () => {
  const item = newAdaptiveCohortEstimate("code-891", "name-356");
  const view = toAdaptiveCohortEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveCohortEstimateViews([item, item]).length, 2, "views");
});
