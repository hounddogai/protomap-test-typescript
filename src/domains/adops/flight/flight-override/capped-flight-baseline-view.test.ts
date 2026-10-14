import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedFlightBaselineView, toCappedFlightBaselineViews } from "./capped-flight-baseline-view.js";
import { newCappedFlightBaseline } from "./capped-flight-baseline.js";

test("CappedFlightBaselineView shows the status in capitals", () => {
  const item = newCappedFlightBaseline("code-67", "title-589");
  const view = toCappedFlightBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedFlightBaselineViews([item, item]).length, 2, "views");
});
