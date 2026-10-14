import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimarySenderSegmentView, toPrimarySenderSegmentViews } from "./primary-sender-segment-view.js";
import { newPrimarySenderSegment } from "./primary-sender-segment.js";

test("PrimarySenderSegmentView shows the status in capitals", () => {
  const item = newPrimarySenderSegment("code-667", "label-978");
  const view = toPrimarySenderSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimarySenderSegmentViews([item, item]).length, 2, "views");
});
