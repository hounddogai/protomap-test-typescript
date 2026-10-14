import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyCreativeSegmentView, toLegacyCreativeSegmentViews } from "./legacy-creative-segment-view.js";
import { newLegacyCreativeSegment } from "./legacy-creative-segment.js";

test("LegacyCreativeSegmentView shows the status in capitals", () => {
  const item = newLegacyCreativeSegment("code-84", "title-627");
  const view = toLegacyCreativeSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyCreativeSegmentViews([item, item]).length, 2, "views");
});
