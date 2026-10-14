import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewBundleView, toTicketViewBundleViews } from "./ticket-view-bundle-view.js";
import { newTicketViewBundle } from "./ticket-view-bundle.js";

test("TicketViewBundleView shows the status in capitals", () => {
  const item = newTicketViewBundle("code-78", "name-800");
  const view = toTicketViewBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewBundleViews([item, item]).length, 2, "views");
});
