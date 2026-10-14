import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedOptOutProfileView, toWeightedOptOutProfileViews } from "./weighted-opt-out-profile-view.js";
import { newWeightedOptOutProfile } from "./weighted-opt-out-profile.js";

test("WeightedOptOutProfileView shows the status in capitals", () => {
  const item = newWeightedOptOutProfile("code-288", "label-310");
  const view = toWeightedOptOutProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedOptOutProfileViews([item, item]).length, 2, "views");
});
