import assert from "node:assert/strict";
import { test } from "node:test";
import { toFlightSummaryView, toFlightSummaryViews } from "./flight-summary-view.js";
import { newFlightSummary } from "./flight-summary.js";

test("FlightSummaryView shows the status in capitals", () => {
  const item = newFlightSummary("code-266", "name-824");
  const view = toFlightSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFlightSummaryViews([item, item]).length, 2, "views");
});
