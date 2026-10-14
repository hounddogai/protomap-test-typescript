import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionDraftView, toRetentionDraftViews } from "./retention-draft-view.js";
import { newRetentionDraft } from "./retention-draft.js";

test("RetentionDraftView shows the status in capitals", () => {
  const item = newRetentionDraft("code-523", "label-955");
  const view = toRetentionDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionDraftViews([item, item]).length, 2, "views");
});
