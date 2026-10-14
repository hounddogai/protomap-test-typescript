import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingQueueRecordView, toRollingQueueRecordViews } from "./rolling-queue-record-view.js";
import { newRollingQueueRecord } from "./rolling-queue-record.js";

test("RollingQueueRecordView shows the status in capitals", () => {
  const item = newRollingQueueRecord("code-706", "name-94");
  const view = toRollingQueueRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingQueueRecordViews([item, item]).length, 2, "views");
});
