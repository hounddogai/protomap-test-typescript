import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowSegmentView, toWindowSegmentViews } from "./window-segment-view.js";
import { newWindowSegment } from "./window-segment.js";

test("WindowSegmentView shows the status in capitals", () => {
  const item = newWindowSegment("code-983", "name-245");
  const view = toWindowSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowSegmentViews([item, item]).length, 2, "views");
});
