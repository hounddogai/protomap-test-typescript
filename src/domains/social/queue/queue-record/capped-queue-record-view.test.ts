import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedQueueRecordView, toCappedQueueRecordViews } from "./capped-queue-record-view.js";
import { newCappedQueueRecord } from "./capped-queue-record.js";

test("CappedQueueRecordView shows the status in capitals", () => {
  const item = newCappedQueueRecord("code-419", "title-101");
  const view = toCappedQueueRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedQueueRecordViews([item, item]).length, 2, "views");
});
