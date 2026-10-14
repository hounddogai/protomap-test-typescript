import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationCycleView, toReputationCycleViews } from "./reputation-cycle-view.js";
import { newReputationCycle } from "./reputation-cycle.js";

test("ReputationCycleView shows the status in capitals", () => {
  const item = newReputationCycle("code-37", "title-724");
  const view = toReputationCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationCycleViews([item, item]).length, 2, "views");
});
