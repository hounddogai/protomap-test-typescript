import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalTicketViewBundleView,
  toRegionalTicketViewBundleViews,
} from "./regional-ticket-view-bundle-view.js";
import { newRegionalTicketViewBundle } from "./regional-ticket-view-bundle.js";

test("RegionalTicketViewBundleView shows the status in capitals", () => {
  const item = newRegionalTicketViewBundle("code-436", "label-941");
  const view = toRegionalTicketViewBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalTicketViewBundleViews([item, item]).length, 2, "views");
});
