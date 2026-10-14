import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackExitRuleCycleView, toFallbackExitRuleCycleViews } from "./fallback-exit-rule-cycle-view.js";
import { newFallbackExitRuleCycle } from "./fallback-exit-rule-cycle.js";

test("FallbackExitRuleCycleView shows the status in capitals", () => {
  const item = newFallbackExitRuleCycle("code-338", "name-11");
  const view = toFallbackExitRuleCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackExitRuleCycleViews([item, item]).length, 2, "views");
});
