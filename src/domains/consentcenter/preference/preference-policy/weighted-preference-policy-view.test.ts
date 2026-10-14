import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedPreferencePolicyView,
  toWeightedPreferencePolicyViews,
} from "./weighted-preference-policy-view.js";
import { newWeightedPreferencePolicy } from "./weighted-preference-policy.js";

test("WeightedPreferencePolicyView shows the status in capitals", () => {
  const item = newWeightedPreferencePolicy("code-312", "name-882");
  const view = toWeightedPreferencePolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedPreferencePolicyViews([item, item]).length, 2, "views");
});
