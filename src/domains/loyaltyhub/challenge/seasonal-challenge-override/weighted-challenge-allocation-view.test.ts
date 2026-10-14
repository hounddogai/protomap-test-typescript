import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedChallengeAllocationView,
  toWeightedChallengeAllocationViews,
} from "./weighted-challenge-allocation-view.js";
import { newWeightedChallengeAllocation } from "./weighted-challenge-allocation.js";

test("WeightedChallengeAllocationView shows the status in capitals", () => {
  const item = newWeightedChallengeAllocation("code-698", "title-49");
  const view = toWeightedChallengeAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedChallengeAllocationViews([item, item]).length, 2, "views");
});
