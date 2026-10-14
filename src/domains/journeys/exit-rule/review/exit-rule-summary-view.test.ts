import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleSummaryView, toExitRuleSummaryViews } from "./exit-rule-summary-view.js";
import { newExitRuleSummary } from "./exit-rule-summary.js";

test("ExitRuleSummaryView shows the status in capitals", () => {
  const item = newExitRuleSummary("code-485", "title-567");
  const view = toExitRuleSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleSummaryViews([item, item]).length, 2, "views");
});
