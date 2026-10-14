import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoubleOptInDraftView, toDoubleOptInDraftViews } from "./double-opt-in-draft-view.js";
import { newDoubleOptInDraft } from "./double-opt-in-draft.js";

test("DoubleOptInDraftView shows the status in capitals", () => {
  const item = newDoubleOptInDraft("code-427", "label-538");
  const view = toDoubleOptInDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDoubleOptInDraftViews([item, item]).length, 2, "views");
});
