import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyVarianceView, toJourneyVarianceViews } from "./journey-variance-view.js";
import { newJourneyVariance } from "./journey-variance.js";

test("JourneyVarianceView shows the status in capitals", () => {
  const item = newJourneyVariance("code-151", "label-45");
  const view = toJourneyVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyVarianceViews([item, item]).length, 2, "views");
});
