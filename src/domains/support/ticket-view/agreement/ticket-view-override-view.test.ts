import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewOverrideView, toTicketViewOverrideViews } from "./ticket-view-override-view.js";
import { newTicketViewOverride } from "./ticket-view-override.js";

test("TicketViewOverrideView shows the status in capitals", () => {
  const item = newTicketViewOverride("code-920", "title-775");
  const view = toTicketViewOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewOverrideViews([item, item]).length, 2, "views");
});
