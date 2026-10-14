import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedEnrollmentDraftView, toCappedEnrollmentDraftViews } from "./capped-enrollment-draft-view.js";
import { newCappedEnrollmentDraft } from "./capped-enrollment-draft.js";

test("CappedEnrollmentDraftView shows the status in capitals", () => {
  const item = newCappedEnrollmentDraft("code-533", "label-3");
  const view = toCappedEnrollmentDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedEnrollmentDraftViews([item, item]).length, 2, "views");
});
