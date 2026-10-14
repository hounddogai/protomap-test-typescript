import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionDraftView, toMentionDraftViews } from "./mention-draft-view.js";
import { newMentionDraft } from "./mention-draft.js";

test("MentionDraftView shows the status in capitals", () => {
  const item = newMentionDraft("code-607", "name-292");
  const view = toMentionDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionDraftViews([item, item]).length, 2, "views");
});
