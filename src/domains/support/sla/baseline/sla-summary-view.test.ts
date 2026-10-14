import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaSummaryView, toSlaSummaryViews } from "./sla-summary-view.js";
import { newSlaSummary } from "./sla-summary.js";

test("SlaSummaryView shows the status in capitals", () => {
  const item = newSlaSummary("code-863", "label-200");
  const view = toSlaSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaSummaryViews([item, item]).length, 2, "views");
});
