import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedMentionCycleView, toWeightedMentionCycleViews } from "./weighted-mention-cycle-view.js";
import { newWeightedMentionCycle } from "./weighted-mention-cycle.js";

test("WeightedMentionCycleView shows the status in capitals", () => {
  const item = newWeightedMentionCycle("code-232", "label-449");
  const view = toWeightedMentionCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedMentionCycleViews([item, item]).length, 2, "views");
});
