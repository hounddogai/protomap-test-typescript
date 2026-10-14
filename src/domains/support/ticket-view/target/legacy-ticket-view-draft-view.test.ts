import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyTicketViewDraftView, toLegacyTicketViewDraftViews } from "./legacy-ticket-view-draft-view.js";
import { newLegacyTicketViewDraft } from "./legacy-ticket-view-draft.js";

test("LegacyTicketViewDraftView shows the status in capitals", () => {
  const item = newLegacyTicketViewDraft("code-452", "title-487");
  const view = toLegacyTicketViewDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyTicketViewDraftViews([item, item]).length, 2, "views");
});
