import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencySegmentView, toFrequencySegmentViews } from "./frequency-segment-view.js";
import { newFrequencySegment } from "./frequency-segment.js";

test("FrequencySegmentView shows the status in capitals", () => {
  const item = newFrequencySegment("code-490", "label-478");
  const view = toFrequencySegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencySegmentViews([item, item]).length, 2, "views");
});
