import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalNudgeSummaryView, toRegionalNudgeSummaryViews } from "./regional-nudge-summary-view.js";
import { newRegionalNudgeSummary } from "./regional-nudge-summary.js";

test("RegionalNudgeSummaryView shows the status in capitals", () => {
  const item = newRegionalNudgeSummary("code-72", "title-350");
  const view = toRegionalNudgeSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalNudgeSummaryViews([item, item]).length, 2, "views");
});
