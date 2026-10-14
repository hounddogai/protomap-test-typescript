import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingPathRecordView, toPendingPathRecordViews } from "./pending-path-record-view.js";
import { newPendingPathRecord } from "./pending-path-record.js";

test("PendingPathRecordView shows the status in capitals", () => {
  const item = newPendingPathRecord("code-820", "label-958");
  const view = toPendingPathRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingPathRecordViews([item, item]).length, 2, "views");
});
