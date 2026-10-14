import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingMentionRecordView, toRollingMentionRecordViews } from "./rolling-mention-record-view.js";
import { newRollingMentionRecord } from "./rolling-mention-record.js";

test("RollingMentionRecordView shows the status in capitals", () => {
  const item = newRollingMentionRecord("code-528", "name-715");
  const view = toRollingMentionRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingMentionRecordViews([item, item]).length, 2, "views");
});
