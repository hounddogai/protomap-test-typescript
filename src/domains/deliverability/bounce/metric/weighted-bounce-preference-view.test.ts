import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedBouncePreferenceView,
  toWeightedBouncePreferenceViews,
} from "./weighted-bounce-preference-view.js";
import { newWeightedBouncePreference } from "./weighted-bounce-preference.js";

test("WeightedBouncePreferenceView shows the status in capitals", () => {
  const item = newWeightedBouncePreference("code-573", "name-298");
  const view = toWeightedBouncePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedBouncePreferenceViews([item, item]).length, 2, "views");
});
