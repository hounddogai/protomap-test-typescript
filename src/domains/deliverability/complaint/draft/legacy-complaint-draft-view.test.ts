import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyComplaintDraftView, toLegacyComplaintDraftViews } from "./legacy-complaint-draft-view.js";
import { newLegacyComplaintDraft } from "./legacy-complaint-draft.js";

test("LegacyComplaintDraftView shows the status in capitals", () => {
  const item = newLegacyComplaintDraft("code-925", "title-56");
  const view = toLegacyComplaintDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyComplaintDraftViews([item, item]).length, 2, "views");
});
