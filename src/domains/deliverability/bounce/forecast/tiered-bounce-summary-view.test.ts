import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredBounceSummaryView, toTieredBounceSummaryViews } from "./tiered-bounce-summary-view.js";
import { newTieredBounceSummary } from "./tiered-bounce-summary.js";

test("TieredBounceSummaryView shows the status in capitals", () => {
  const item = newTieredBounceSummary("code-72", "name-930");
  const view = toTieredBounceSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredBounceSummaryViews([item, item]).length, 2, "views");
});
