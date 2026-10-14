import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveFunnelEstimateView, toAdaptiveFunnelEstimateViews } from "./adaptive-funnel-estimate-view.js";
import { newAdaptiveFunnelEstimate } from "./adaptive-funnel-estimate.js";

test("AdaptiveFunnelEstimateView shows the status in capitals", () => {
  const item = newAdaptiveFunnelEstimate("code-865", "title-268");
  const view = toAdaptiveFunnelEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveFunnelEstimateViews([item, item]).length, 2, "views");
});
