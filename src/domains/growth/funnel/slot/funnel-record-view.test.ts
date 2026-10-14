import assert from "node:assert/strict";
import { test } from "node:test";
import { toFunnelRecordView, toFunnelRecordViews } from "./funnel-record-view.js";
import { newFunnelRecord } from "./funnel-record.js";

test("FunnelRecordView shows the status in capitals", () => {
  const item = newFunnelRecord("code-759", "label-854");
  const view = toFunnelRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFunnelRecordViews([item, item]).length, 2, "views");
});
