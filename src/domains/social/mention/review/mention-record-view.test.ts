import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionRecordView, toMentionRecordViews } from "./mention-record-view.js";
import { newMentionRecord } from "./mention-record.js";

test("MentionRecordView shows the status in capitals", () => {
  const item = newMentionRecord("code-165", "name-308");
  const view = toMentionRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionRecordViews([item, item]).length, 2, "views");
});
