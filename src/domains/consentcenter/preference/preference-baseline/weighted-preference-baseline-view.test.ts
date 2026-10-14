import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedPreferenceBaselineView,
  toWeightedPreferenceBaselineViews,
} from "./weighted-preference-baseline-view.js";
import { newWeightedPreferenceBaseline } from "./weighted-preference-baseline.js";

test("WeightedPreferenceBaselineView shows the status in capitals", () => {
  const item = newWeightedPreferenceBaseline("code-189", "name-178");
  const view = toWeightedPreferenceBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedPreferenceBaselineViews([item, item]).length, 2, "views");
});
