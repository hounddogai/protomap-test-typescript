import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredTicketViewAdjustmentView,
  toTieredTicketViewAdjustmentViews,
} from "./tiered-ticket-view-adjustment-view.js";
import { newTieredTicketViewAdjustment } from "./tiered-ticket-view-adjustment.js";

test("TieredTicketViewAdjustmentView shows the status in capitals", () => {
  const item = newTieredTicketViewAdjustment("code-512", "title-923");
  const view = toTieredTicketViewAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredTicketViewAdjustmentViews([item, item]).length, 2, "views");
});
