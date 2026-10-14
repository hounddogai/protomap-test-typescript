import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredTouchpointSummaryView, toTieredTouchpointSummaryViews } from "./tiered-touchpoint-summary-view.js";
import { newTieredTouchpointSummary } from "./tiered-touchpoint-summary.js";

test("TieredTouchpointSummaryView shows the status in capitals", () => {
  const item = newTieredTouchpointSummary("code-616", "name-568");
  const view = toTieredTouchpointSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredTouchpointSummaryViews([item, item]).length, 2, "views");
});
