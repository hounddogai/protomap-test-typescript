import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultWarmupSummaryView, toDefaultWarmupSummaryViews } from "./default-warmup-summary-view.js";
import { newDefaultWarmupSummary } from "./default-warmup-summary.js";

test("DefaultWarmupSummaryView shows the status in capitals", () => {
  const item = newDefaultWarmupSummary("code-379", "label-730");
  const view = toDefaultWarmupSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultWarmupSummaryViews([item, item]).length, 2, "views");
});
