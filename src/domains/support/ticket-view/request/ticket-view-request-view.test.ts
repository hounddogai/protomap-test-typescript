import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewRequestView, toTicketViewRequestViews } from "./ticket-view-request-view.js";
import { newTicketViewRequest } from "./ticket-view-request.js";

test("TicketViewRequestView shows the status in capitals", () => {
  const item = newTicketViewRequest("code-723", "label-723");
  const view = toTicketViewRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewRequestViews([item, item]).length, 2, "views");
});
