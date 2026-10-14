import assert from "node:assert/strict";
import { test } from "node:test";
import { toActivationCycleView, toActivationCycleViews } from "./activation-cycle-view.js";
import { newActivationCycle } from "./activation-cycle.js";

test("ActivationCycleView shows the status in capitals", () => {
  const item = newActivationCycle("code-916", "label-106");
  const view = toActivationCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toActivationCycleViews([item, item]).length, 2, "views");
});
