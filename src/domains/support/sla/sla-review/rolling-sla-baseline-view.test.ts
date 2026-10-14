import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingSlaBaselineView, toRollingSlaBaselineViews } from "./rolling-sla-baseline-view.js";
import { newRollingSlaBaseline } from "./rolling-sla-baseline.js";

test("RollingSlaBaselineView shows the status in capitals", () => {
  const item = newRollingSlaBaseline("code-317", "name-623");
  const view = toRollingSlaBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingSlaBaselineViews([item, item]).length, 2, "views");
});
