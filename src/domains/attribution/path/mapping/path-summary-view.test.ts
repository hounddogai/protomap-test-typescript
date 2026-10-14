import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathSummaryView, toPathSummaryViews } from "./path-summary-view.js";
import { newPathSummary } from "./path-summary.js";

test("PathSummaryView shows the status in capitals", () => {
  const item = newPathSummary("code-882", "label-261");
  const view = toPathSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathSummaryViews([item, item]).length, 2, "views");
});
