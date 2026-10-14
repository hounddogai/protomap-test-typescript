import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutSegmentView, toPayoutSegmentViews } from "./payout-segment-view.js";
import { newPayoutSegment } from "./payout-segment.js";

test("PayoutSegmentView shows the status in capitals", () => {
  const item = newPayoutSegment("code-901", "label-555");
  const view = toPayoutSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutSegmentViews([item, item]).length, 2, "views");
});
