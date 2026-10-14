import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedCreditRecordView, toBatchedCreditRecordViews } from "./batched-credit-record-view.js";
import { newBatchedCreditRecord } from "./batched-credit-record.js";

test("BatchedCreditRecordView shows the status in capitals", () => {
  const item = newBatchedCreditRecord("code-54", "title-699");
  const view = toBatchedCreditRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedCreditRecordViews([item, item]).length, 2, "views");
});
