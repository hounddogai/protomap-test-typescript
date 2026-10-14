import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLegacyDoubleOptInSegmentView,
  toLegacyDoubleOptInSegmentViews,
} from "./legacy-double-opt-in-segment-view.js";
import { newLegacyDoubleOptInSegment } from "./legacy-double-opt-in-segment.js";

test("LegacyDoubleOptInSegmentView shows the status in capitals", () => {
  const item = newLegacyDoubleOptInSegment("code-773", "title-159");
  const view = toLegacyDoubleOptInSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyDoubleOptInSegmentViews([item, item]).length, 2, "views");
});
