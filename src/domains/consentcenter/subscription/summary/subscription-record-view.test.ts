import assert from "node:assert/strict";
import { test } from "node:test";
import { toSubscriptionRecordView, toSubscriptionRecordViews } from "./subscription-record-view.js";
import { newSubscriptionRecord } from "./subscription-record.js";

test("SubscriptionRecordView shows the status in capitals", () => {
  const item = newSubscriptionRecord("code-192", "label-792");
  const view = toSubscriptionRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSubscriptionRecordViews([item, item]).length, 2, "views");
});
