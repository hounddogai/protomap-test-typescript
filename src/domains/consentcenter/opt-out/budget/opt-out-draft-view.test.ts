import assert from "node:assert/strict";
import { test } from "node:test";
import { toOptOutDraftView, toOptOutDraftViews } from "./opt-out-draft-view.js";
import { newOptOutDraft } from "./opt-out-draft.js";

test("OptOutDraftView shows the status in capitals", () => {
  const item = newOptOutDraft("code-185", "label-655");
  const view = toOptOutDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toOptOutDraftViews([item, item]).length, 2, "views");
});
