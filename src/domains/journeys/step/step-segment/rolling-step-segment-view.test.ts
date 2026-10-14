import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingStepSegmentView, toRollingStepSegmentViews } from "./rolling-step-segment-view.js";
import { newRollingStepSegment } from "./rolling-step-segment.js";

test("RollingStepSegmentView shows the status in capitals", () => {
  const item = newRollingStepSegment("code-599", "title-229");
  const view = toRollingStepSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingStepSegmentViews([item, item]).length, 2, "views");
});
