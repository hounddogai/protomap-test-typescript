import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionCycleView, toDeflectionCycleViews } from "./deflection-cycle-view.js";
import { newDeflectionCycle } from "./deflection-cycle.js";

test("DeflectionCycleView shows the status in capitals", () => {
  const item = newDeflectionCycle("code-481", "label-858");
  const view = toDeflectionCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionCycleViews([item, item]).length, 2, "views");
});
