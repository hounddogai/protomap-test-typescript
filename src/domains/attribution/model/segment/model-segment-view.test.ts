import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelSegmentView, toModelSegmentViews } from "./model-segment-view.js";
import { newModelSegment } from "./model-segment.js";

test("ModelSegmentView shows the status in capitals", () => {
  const item = newModelSegment("code-517", "title-401");
  const view = toModelSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelSegmentViews([item, item]).length, 2, "views");
});
