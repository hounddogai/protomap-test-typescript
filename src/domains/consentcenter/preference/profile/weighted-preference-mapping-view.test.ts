import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedPreferenceMappingView,
  toWeightedPreferenceMappingViews,
} from "./weighted-preference-mapping-view.js";
import { newWeightedPreferenceMapping } from "./weighted-preference-mapping.js";

test("WeightedPreferenceMappingView shows the status in capitals", () => {
  const item = newWeightedPreferenceMapping("code-136", "name-850");
  const view = toWeightedPreferenceMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedPreferenceMappingViews([item, item]).length, 2, "views");
});
