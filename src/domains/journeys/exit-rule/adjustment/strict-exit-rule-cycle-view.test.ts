import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictExitRuleCycleView, toStrictExitRuleCycleViews } from "./strict-exit-rule-cycle-view.js";
import { newStrictExitRuleCycle } from "./strict-exit-rule-cycle.js";

test("StrictExitRuleCycleView shows the status in capitals", () => {
  const item = newStrictExitRuleCycle("code-957", "name-716");
  const view = toStrictExitRuleCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictExitRuleCycleViews([item, item]).length, 2, "views");
});
