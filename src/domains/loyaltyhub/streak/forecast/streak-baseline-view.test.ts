import assert from "node:assert/strict";
import { test } from "node:test";
import { toStreakBaselineView, toStreakBaselineViews } from "./streak-baseline-view.js";
import { newStreakBaseline } from "./streak-baseline.js";

test("StreakBaselineView shows the status in capitals", () => {
  const item = newStreakBaseline("code-507", "name-12");
  const view = toStreakBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStreakBaselineViews([item, item]).length, 2, "views");
});
