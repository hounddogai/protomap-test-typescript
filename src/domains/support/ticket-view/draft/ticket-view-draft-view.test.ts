import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewDraftView, toTicketViewDraftViews } from "./ticket-view-draft-view.js";
import { newTicketViewDraft } from "./ticket-view-draft.js";

test("TicketViewDraftView shows the status in capitals", () => {
  const item = newTicketViewDraft("code-637", "title-764");
  const view = toTicketViewDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewDraftViews([item, item]).length, 2, "views");
});
