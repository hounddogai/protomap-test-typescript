import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyBaselineView, toJourneyBaselineViews } from "./journey-baseline-view.js";
import { newJourneyBaseline } from "./journey-baseline.js";

test("JourneyBaselineView shows the status in capitals", () => {
  const item = newJourneyBaseline("code-906", "title-96");
  const view = toJourneyBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyBaselineViews([item, item]).length, 2, "views");
});
