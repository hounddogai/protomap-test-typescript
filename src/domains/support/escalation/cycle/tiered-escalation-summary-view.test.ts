import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredEscalationSummaryView, toTieredEscalationSummaryViews } from "./tiered-escalation-summary-view.js";
import { newTieredEscalationSummary } from "./tiered-escalation-summary.js";

test("TieredEscalationSummaryView shows the status in capitals", () => {
  const item = newTieredEscalationSummary("code-990", "label-221");
  const view = toTieredEscalationSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredEscalationSummaryViews([item, item]).length, 2, "views");
});
