import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedConversionRecordView, toBatchedConversionRecordViews } from "./batched-conversion-record-view.js";
import { newBatchedConversionRecord } from "./batched-conversion-record.js";

test("BatchedConversionRecordView shows the status in capitals", () => {
  const item = newBatchedConversionRecord("code-763", "label-81");
  const view = toBatchedConversionRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedConversionRecordViews([item, item]).length, 2, "views");
});
