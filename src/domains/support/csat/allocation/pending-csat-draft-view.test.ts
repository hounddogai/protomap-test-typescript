import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingCsatDraftView, toPendingCsatDraftViews } from "./pending-csat-draft-view.js";
import { newPendingCsatDraft } from "./pending-csat-draft.js";

test("PendingCsatDraftView shows the status in capitals", () => {
  const item = newPendingCsatDraft("code-46", "name-557");
  const view = toPendingCsatDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingCsatDraftViews([item, item]).length, 2, "views");
});
