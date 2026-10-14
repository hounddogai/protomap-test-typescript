import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLenientDeflectionSegmentView,
  toLenientDeflectionSegmentViews,
} from "./lenient-deflection-segment-view.js";
import { newLenientDeflectionSegment } from "./lenient-deflection-segment.js";

test("LenientDeflectionSegmentView shows the status in capitals", () => {
  const item = newLenientDeflectionSegment("code-176", "name-488");
  const view = toLenientDeflectionSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientDeflectionSegmentViews([item, item]).length, 2, "views");
});
