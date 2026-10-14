import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionSegmentView, toDeflectionSegmentViews } from "./deflection-segment-view.js";
import { newDeflectionSegment } from "./deflection-segment.js";

test("DeflectionSegmentView shows the status in capitals", () => {
  const item = newDeflectionSegment("code-355", "name-661");
  const view = toDeflectionSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionSegmentViews([item, item]).length, 2, "views");
});
