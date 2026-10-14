import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingSuppressionRecordView,
  toPendingSuppressionRecordViews,
} from "./pending-suppression-record-view.js";
import { newPendingSuppressionRecord } from "./pending-suppression-record.js";

test("PendingSuppressionRecordView shows the status in capitals", () => {
  const item = newPendingSuppressionRecord("code-518", "label-817");
  const view = toPendingSuppressionRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingSuppressionRecordViews([item, item]).length, 2, "views");
});
