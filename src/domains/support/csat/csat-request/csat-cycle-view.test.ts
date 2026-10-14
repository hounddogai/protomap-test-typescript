import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatCycleView, toCsatCycleViews } from "./csat-cycle-view.js";
import { newCsatCycle } from "./csat-cycle.js";

test("CsatCycleView shows the status in capitals", () => {
  const item = newCsatCycle("code-684", "name-80");
  const view = toCsatCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatCycleViews([item, item]).length, 2, "views");
});
