import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalTicketViewRecordView,
  toRegionalTicketViewRecordViews,
} from "./regional-ticket-view-record-view.js";
import { newRegionalTicketViewRecord } from "./regional-ticket-view-record.js";

test("RegionalTicketViewRecordView shows the status in capitals", () => {
  const item = newRegionalTicketViewRecord("code-655", "name-766");
  const view = toRegionalTicketViewRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalTicketViewRecordViews([item, item]).length, 2, "views");
});
