import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredTicketViewBaselineView,
  toTieredTicketViewBaselineViews,
} from "./tiered-ticket-view-baseline-view.js";
import { newTieredTicketViewBaseline } from "./tiered-ticket-view-baseline.js";

test("TieredTicketViewBaselineView shows the status in capitals", () => {
  const item = newTieredTicketViewBaseline("code-200", "name-332");
  const view = toTieredTicketViewBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredTicketViewBaselineViews([item, item]).length, 2, "views");
});
