import assert from "node:assert/strict";
import { test } from "node:test";
import { toRedemptionRecordView, toRedemptionRecordViews } from "./redemption-record-view.js";
import { newRedemptionRecord } from "./redemption-record.js";

test("RedemptionRecordView shows the status in capitals", () => {
  const item = newRedemptionRecord("code-967", "label-464");
  const view = toRedemptionRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRedemptionRecordViews([item, item]).length, 2, "views");
});
