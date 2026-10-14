import assert from "node:assert/strict";
import { test } from "node:test";
import { toStreakAdjustmentView, toStreakAdjustmentViews } from "./streak-adjustment-view.js";
import { newStreakAdjustment } from "./streak-adjustment.js";

test("StreakAdjustmentView shows the status in capitals", () => {
  const item = newStreakAdjustment("code-598", "name-54");
  const view = toStreakAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStreakAdjustmentViews([item, item]).length, 2, "views");
});
