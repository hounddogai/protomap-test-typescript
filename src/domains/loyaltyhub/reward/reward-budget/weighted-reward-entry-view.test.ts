import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedRewardEntryView, toWeightedRewardEntryViews } from "./weighted-reward-entry-view.js";
import { newWeightedRewardEntry } from "./weighted-reward-entry.js";

test("WeightedRewardEntryView shows the status in capitals", () => {
  const item = newWeightedRewardEntry("code-921", "name-719");
  const view = toWeightedRewardEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedRewardEntryViews([item, item]).length, 2, "views");
});
