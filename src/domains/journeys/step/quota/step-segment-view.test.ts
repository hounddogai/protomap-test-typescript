import assert from "node:assert/strict";
import { test } from "node:test";
import { toStepSegmentView, toStepSegmentViews } from "./step-segment-view.js";
import { newStepSegment } from "./step-segment.js";

test("StepSegmentView shows the status in capitals", () => {
  const item = newStepSegment("code-932", "label-472");
  const view = toStepSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStepSegmentViews([item, item]).length, 2, "views");
});
