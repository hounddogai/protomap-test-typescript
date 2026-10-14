import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultRewardSegmentView, toDefaultRewardSegmentViews } from "./default-reward-segment-view.js";
import { newDefaultRewardSegment } from "./default-reward-segment.js";

test("DefaultRewardSegmentView shows the status in capitals", () => {
  const item = newDefaultRewardSegment("code-464", "title-301");
  const view = toDefaultRewardSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultRewardSegmentViews([item, item]).length, 2, "views");
});
