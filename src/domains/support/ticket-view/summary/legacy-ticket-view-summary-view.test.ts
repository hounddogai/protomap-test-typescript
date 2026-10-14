import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyTicketViewSummaryView, toLegacyTicketViewSummaryViews } from "./legacy-ticket-view-summary-view.js";
import { newLegacyTicketViewSummary } from "./legacy-ticket-view-summary.js";

test("LegacyTicketViewSummaryView shows the status in capitals", () => {
  const item = newLegacyTicketViewSummary("code-178", "title-234");
  const view = toLegacyTicketViewSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyTicketViewSummaryViews([item, item]).length, 2, "views");
});
