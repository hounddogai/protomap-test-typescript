import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedCreditDraftView, toCappedCreditDraftViews } from "./capped-credit-draft-view.js";
import { newCappedCreditDraft } from "./capped-credit-draft.js";

test("CappedCreditDraftView shows the status in capitals", () => {
  const item = newCappedCreditDraft("code-549", "title-854");
  const view = toCappedCreditDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedCreditDraftViews([item, item]).length, 2, "views");
});
