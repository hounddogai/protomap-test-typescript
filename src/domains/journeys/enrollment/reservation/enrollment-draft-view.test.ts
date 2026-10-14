import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentDraftView, toEnrollmentDraftViews } from "./enrollment-draft-view.js";
import { newEnrollmentDraft } from "./enrollment-draft.js";

test("EnrollmentDraftView shows the status in capitals", () => {
  const item = newEnrollmentDraft("code-519", "label-842");
  const view = toEnrollmentDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentDraftViews([item, item]).length, 2, "views");
});
