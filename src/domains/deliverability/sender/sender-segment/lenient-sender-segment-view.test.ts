import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientSenderSegmentView, toLenientSenderSegmentViews } from "./lenient-sender-segment-view.js";
import { newLenientSenderSegment } from "./lenient-sender-segment.js";

test("LenientSenderSegmentView shows the status in capitals", () => {
  const item = newLenientSenderSegment("code-617", "name-283");
  const view = toLenientSenderSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientSenderSegmentViews([item, item]).length, 2, "views");
});
