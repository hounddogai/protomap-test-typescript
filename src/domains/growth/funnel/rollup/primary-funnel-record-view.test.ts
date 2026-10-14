import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryFunnelRecordView, toPrimaryFunnelRecordViews } from "./primary-funnel-record-view.js";
import { newPrimaryFunnelRecord } from "./primary-funnel-record.js";

test("PrimaryFunnelRecordView shows the status in capitals", () => {
  const item = newPrimaryFunnelRecord("code-72", "label-165");
  const view = toPrimaryFunnelRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryFunnelRecordViews([item, item]).length, 2, "views");
});
