import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalFlightSummaryView, toGlobalFlightSummaryViews } from "./global-flight-summary-view.js";
import { newGlobalFlightSummary } from "./global-flight-summary.js";

test("GlobalFlightSummaryView shows the status in capitals", () => {
  const item = newGlobalFlightSummary("code-174", "label-657");
  const view = toGlobalFlightSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalFlightSummaryViews([item, item]).length, 2, "views");
});
