import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledPostRecordView, toScheduledPostRecordViews } from "./scheduled-post-record-view.js";
import { newScheduledPostRecord } from "./scheduled-post-record.js";

test("ScheduledPostRecordView shows the status in capitals", () => {
  const item = newScheduledPostRecord("code-165", "label-80");
  const view = toScheduledPostRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledPostRecordViews([item, item]).length, 2, "views");
});
