import assert from "node:assert/strict";
import { test } from "node:test";
import { toFraudCheckRecordView, toFraudCheckRecordViews } from "./fraud-check-record-view.js";
import { newFraudCheckRecord } from "./fraud-check-record.js";

test("FraudCheckRecordView shows the status in capitals", () => {
  const item = newFraudCheckRecord("code-274", "title-619");
  const view = toFraudCheckRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFraudCheckRecordViews([item, item]).length, 2, "views");
});
