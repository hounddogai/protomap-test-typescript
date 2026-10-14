import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultPreferenceSegmentView,
  toDefaultPreferenceSegmentViews,
} from "./default-preference-segment-view.js";
import { newDefaultPreferenceSegment } from "./default-preference-segment.js";

test("DefaultPreferenceSegmentView shows the status in capitals", () => {
  const item = newDefaultPreferenceSegment("code-606", "name-972");
  const view = toDefaultPreferenceSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultPreferenceSegmentViews([item, item]).length, 2, "views");
});
