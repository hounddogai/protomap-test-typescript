import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatSummaryView, toCsatSummaryViews } from "./csat-summary-view.js";
import { newCsatSummary } from "./csat-summary.js";

test("CsatSummaryView shows the status in capitals", () => {
  const item = newCsatSummary("code-14", "label-628");
  const view = toCsatSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatSummaryViews([item, item]).length, 2, "views");
});
