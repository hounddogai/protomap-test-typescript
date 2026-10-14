import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreativeSegmentView, toCreativeSegmentViews } from "./creative-segment-view.js";
import { newCreativeSegment } from "./creative-segment.js";

test("CreativeSegmentView shows the status in capitals", () => {
  const item = newCreativeSegment("code-889", "title-538");
  const view = toCreativeSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreativeSegmentViews([item, item]).length, 2, "views");
});
