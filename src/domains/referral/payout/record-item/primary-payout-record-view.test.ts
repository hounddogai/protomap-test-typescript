import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryPayoutRecordView, toPrimaryPayoutRecordViews } from "./primary-payout-record-view.js";
import { newPrimaryPayoutRecord } from "./primary-payout-record.js";

test("PrimaryPayoutRecordView shows the status in capitals", () => {
  const item = newPrimaryPayoutRecord("code-943", "name-876");
  const view = toPrimaryPayoutRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryPayoutRecordViews([item, item]).length, 2, "views");
});
