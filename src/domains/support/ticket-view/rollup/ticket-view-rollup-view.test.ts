import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewRollupView, toTicketViewRollupViews } from "./ticket-view-rollup-view.js";
import { newTicketViewRollup } from "./ticket-view-rollup.js";

test("TicketViewRollupView shows the status in capitals", () => {
  const item = newTicketViewRollup("code-869", "label-835");
  const view = toTicketViewRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewRollupViews([item, item]).length, 2, "views");
});
