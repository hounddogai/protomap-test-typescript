import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedStreakRecordView, toBatchedStreakRecordViews } from "./batched-streak-record-view.js";
import { newBatchedStreakRecord } from "./batched-streak-record.js";

test("BatchedStreakRecordView shows the status in capitals", () => {
  const item = newBatchedStreakRecord("code-856", "title-185");
  const view = toBatchedStreakRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedStreakRecordViews([item, item]).length, 2, "views");
});
