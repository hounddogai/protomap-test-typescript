import assert from "node:assert/strict";
import { test } from "node:test";
import { toOptOutSegmentView, toOptOutSegmentViews } from "./opt-out-segment-view.js";
import { newOptOutSegment } from "./opt-out-segment.js";

test("OptOutSegmentView shows the status in capitals", () => {
  const item = newOptOutSegment("code-26", "title-157");
  const view = toOptOutSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toOptOutSegmentViews([item, item]).length, 2, "views");
});
