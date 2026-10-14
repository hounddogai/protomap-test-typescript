import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedBranchProfileView, toWeightedBranchProfileViews } from "./weighted-branch-profile-view.js";
import { newWeightedBranchProfile } from "./weighted-branch-profile.js";

test("WeightedBranchProfileView shows the status in capitals", () => {
  const item = newWeightedBranchProfile("code-958", "title-655");
  const view = toWeightedBranchProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedBranchProfileViews([item, item]).length, 2, "views");
});
