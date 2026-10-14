import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualCreditRecordView, toManualCreditRecordViews } from "./manual-credit-record-view.js";
import { newManualCreditRecord } from "./manual-credit-record.js";

test("ManualCreditRecordView shows the status in capitals", () => {
  const item = newManualCreditRecord("code-374", "name-896");
  const view = toManualCreditRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualCreditRecordViews([item, item]).length, 2, "views");
});
