import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingCreativeSegmentView, toPendingCreativeSegmentViews } from "./pending-creative-segment-view.js";
import { newPendingCreativeSegment } from "./pending-creative-segment.js";

test("PendingCreativeSegmentView shows the status in capitals", () => {
  const item = newPendingCreativeSegment("code-639", "title-204");
  const view = toPendingCreativeSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingCreativeSegmentViews([item, item]).length, 2, "views");
});
