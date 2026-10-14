import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceSummaryView, toBounceSummaryViews } from "./bounce-summary-view.js";
import { newBounceSummary } from "./bounce-summary.js";

test("BounceSummaryView shows the status in capitals", () => {
  const item = newBounceSummary("code-791", "label-22");
  const view = toBounceSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceSummaryViews([item, item]).length, 2, "views");
});
