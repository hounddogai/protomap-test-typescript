import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewAdjustmentView, toTicketViewAdjustmentViews } from "./ticket-view-adjustment-view.js";
import { newTicketViewAdjustment } from "./ticket-view-adjustment.js";

test("TicketViewAdjustmentView shows the status in capitals", () => {
  const item = newTicketViewAdjustment("code-256", "name-826");
  const view = toTicketViewAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewAdjustmentViews([item, item]).length, 2, "views");
});
