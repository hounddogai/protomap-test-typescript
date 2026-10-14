import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictJourneyRollupView, toStrictJourneyRollupViews } from "./strict-journey-rollup-view.js";
import { newStrictJourneyRollup } from "./strict-journey-rollup.js";

test("StrictJourneyRollupView shows the status in capitals", () => {
  const item = newStrictJourneyRollup("code-841", "label-304");
  const view = toStrictJourneyRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictJourneyRollupViews([item, item]).length, 2, "views");
});
