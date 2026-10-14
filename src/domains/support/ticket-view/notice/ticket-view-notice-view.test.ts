import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewNoticeView, toTicketViewNoticeViews } from "./ticket-view-notice-view.js";
import { newTicketViewNotice } from "./ticket-view-notice.js";

test("TicketViewNoticeView shows the status in capitals", () => {
  const item = newTicketViewNotice("code-735", "title-643");
  const view = toTicketViewNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewNoticeViews([item, item]).length, 2, "views");
});
