import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingSummaryView, toPacingSummaryViews } from "./pacing-summary-view.js";
import { newPacingSummary } from "./pacing-summary.js";

test("PacingSummaryView shows the status in capitals", () => {
  const item = newPacingSummary("code-177", "name-505");
  const view = toPacingSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingSummaryViews([item, item]).length, 2, "views");
});
