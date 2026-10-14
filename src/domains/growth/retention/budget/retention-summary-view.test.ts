import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionSummaryView, toRetentionSummaryViews } from "./retention-summary-view.js";
import { newRetentionSummary } from "./retention-summary.js";

test("RetentionSummaryView shows the status in capitals", () => {
  const item = newRetentionSummary("code-571", "name-423");
  const view = toRetentionSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionSummaryViews([item, item]).length, 2, "views");
});
