import assert from "node:assert/strict";
import { test } from "node:test";
import { toLevelSegmentView, toLevelSegmentViews } from "./level-segment-view.js";
import { newLevelSegment } from "./level-segment.js";

test("LevelSegmentView shows the status in capitals", () => {
  const item = newLevelSegment("code-54", "label-625");
  const view = toLevelSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLevelSegmentViews([item, item]).length, 2, "views");
});
