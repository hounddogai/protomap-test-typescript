import assert from "node:assert/strict";
import { test } from "node:test";
import { toOptOutCycleView, toOptOutCycleViews } from "./opt-out-cycle-view.js";
import { newOptOutCycle } from "./opt-out-cycle.js";

test("OptOutCycleView shows the status in capitals", () => {
  const item = newOptOutCycle("code-349", "title-617");
  const view = toOptOutCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toOptOutCycleViews([item, item]).length, 2, "views");
});
