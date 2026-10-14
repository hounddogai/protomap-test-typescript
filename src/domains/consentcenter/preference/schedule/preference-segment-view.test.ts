import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferenceSegmentView, toPreferenceSegmentViews } from "./preference-segment-view.js";
import { newPreferenceSegment } from "./preference-segment.js";

test("PreferenceSegmentView shows the status in capitals", () => {
  const item = newPreferenceSegment("code-230", "name-298");
  const view = toPreferenceSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferenceSegmentViews([item, item]).length, 2, "views");
});
