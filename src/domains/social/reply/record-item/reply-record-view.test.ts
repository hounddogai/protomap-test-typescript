import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyRecordView, toReplyRecordViews } from "./reply-record-view.js";
import { newReplyRecord } from "./reply-record.js";

test("ReplyRecordView shows the status in capitals", () => {
  const item = newReplyRecord("code-201", "name-684");
  const view = toReplyRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyRecordViews([item, item]).length, 2, "views");
});
