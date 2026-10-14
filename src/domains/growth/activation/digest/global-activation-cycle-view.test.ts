import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalActivationCycleView, toGlobalActivationCycleViews } from "./global-activation-cycle-view.js";
import { newGlobalActivationCycle } from "./global-activation-cycle.js";

test("GlobalActivationCycleView shows the status in capitals", () => {
  const item = newGlobalActivationCycle("code-190", "title-850");
  const view = toGlobalActivationCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalActivationCycleViews([item, item]).length, 2, "views");
});
