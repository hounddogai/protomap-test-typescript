import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionEntryView, toMentionEntryViews } from "./mention-entry-view.js";
import { newMentionEntry } from "./mention-entry.js";

test("MentionEntryView shows the status in capitals", () => {
  const item = newMentionEntry("code-530", "title-318");
  const view = toMentionEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionEntryViews([item, item]).length, 2, "views");
});
