import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalEscalationSummaryView, toGlobalEscalationSummaryViews } from "./global-escalation-summary-view.js";
import { newGlobalEscalationSummary } from "./global-escalation-summary.js";

test("GlobalEscalationSummaryView shows the status in capitals", () => {
  const item = newGlobalEscalationSummary("code-162", "name-957");
  const view = toGlobalEscalationSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalEscalationSummaryViews([item, item]).length, 2, "views");
});
