import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleCycleView, toExitRuleCycleViews } from "./exit-rule-cycle-view.js";
import { newExitRuleCycle } from "./exit-rule-cycle.js";

test("ExitRuleCycleView shows the status in capitals", () => {
  const item = newExitRuleCycle("code-842", "title-36");
  const view = toExitRuleCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleCycleViews([item, item]).length, 2, "views");
});
