import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceSegmentView, toBounceSegmentViews } from "./bounce-segment-view.js";
import { newBounceSegment } from "./bounce-segment.js";

test("BounceSegmentView shows the status in capitals", () => {
  const item = newBounceSegment("code-868", "name-780");
  const view = toBounceSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceSegmentViews([item, item]).length, 2, "views");
});
