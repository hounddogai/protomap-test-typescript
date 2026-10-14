import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictCreditRecordView, toStrictCreditRecordViews } from "./strict-credit-record-view.js";
import { newStrictCreditRecord } from "./strict-credit-record.js";

test("StrictCreditRecordView shows the status in capitals", () => {
  const item = newStrictCreditRecord("code-209", "title-274");
  const view = toStrictCreditRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictCreditRecordViews([item, item]).length, 2, "views");
});
