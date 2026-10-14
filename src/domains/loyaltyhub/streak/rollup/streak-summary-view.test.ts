import assert from "node:assert/strict";
import { test } from "node:test";
import { toStreakSummaryView, toStreakSummaryViews } from "./streak-summary-view.js";
import { newStreakSummary } from "./streak-summary.js";

test("StreakSummaryView shows the status in capitals", () => {
  const item = newStreakSummary("code-901", "name-315");
  const view = toStreakSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStreakSummaryViews([item, item]).length, 2, "views");
});
