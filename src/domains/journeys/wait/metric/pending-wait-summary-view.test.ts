import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingWaitSummaryView, toPendingWaitSummaryViews } from "./pending-wait-summary-view.js";
import { newPendingWaitSummary } from "./pending-wait-summary.js";

test("PendingWaitSummaryView shows the status in capitals", () => {
  const item = newPendingWaitSummary("code-411", "title-295");
  const view = toPendingWaitSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingWaitSummaryViews([item, item]).length, 2, "views");
});
