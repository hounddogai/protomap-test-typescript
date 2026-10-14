import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultTicketViewNoticeView, toDefaultTicketViewNoticeViews } from "./default-ticket-view-notice-view.js";
import { newDefaultTicketViewNotice } from "./default-ticket-view-notice.js";

test("DefaultTicketViewNoticeView shows the status in capitals", () => {
  const item = newDefaultTicketViewNotice("code-265", "name-801");
  const view = toDefaultTicketViewNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultTicketViewNoticeViews([item, item]).length, 2, "views");
});
