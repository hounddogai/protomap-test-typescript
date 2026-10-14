import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionSegmentView, toConversionSegmentViews } from "./conversion-segment-view.js";
import { newConversionSegment } from "./conversion-segment.js";

test("ConversionSegmentView shows the status in capitals", () => {
  const item = newConversionSegment("code-232", "label-475");
  const view = toConversionSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionSegmentViews([item, item]).length, 2, "views");
});
