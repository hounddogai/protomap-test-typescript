import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierCycleView, toTierCycleViews } from "./tier-cycle-view.js";
import { newTierCycle } from "./tier-cycle.js";

test("TierCycleView shows the status in capitals", () => {
  const item = newTierCycle("code-243", "title-561");
  const view = toTierCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierCycleViews([item, item]).length, 2, "views");
});
