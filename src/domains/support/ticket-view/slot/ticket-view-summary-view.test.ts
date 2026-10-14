import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewSummaryView, toTicketViewSummaryViews } from "./ticket-view-summary-view.js";
import { newTicketViewSummary } from "./ticket-view-summary.js";

test("TicketViewSummaryView shows the status in capitals", () => {
  const item = newTicketViewSummary("code-33", "title-499");
  const view = toTicketViewSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewSummaryViews([item, item]).length, 2, "views");
});
