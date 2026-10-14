import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingTierThresholdView, toPendingTierThresholdViews } from "./pending-tier-threshold-view.js";
import { newPendingTierThreshold } from "./pending-tier-threshold.js";

test("PendingTierThresholdView shows the status in capitals", () => {
  const item = newPendingTierThreshold("code-749", "title-385");
  const view = toPendingTierThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingTierThresholdViews([item, item]).length, 2, "views");
});
