import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewPreferenceView, toTicketViewPreferenceViews } from "./ticket-view-preference-view.js";
import { newTicketViewPreference } from "./ticket-view-preference.js";

test("TicketViewPreferenceView shows the status in capitals", () => {
  const item = newTicketViewPreference("code-955", "title-876");
  const view = toTicketViewPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewPreferenceViews([item, item]).length, 2, "views");
});
