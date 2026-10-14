import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalInsightSegmentView, toGlobalInsightSegmentViews } from "./global-insight-segment-view.js";
import { newGlobalInsightSegment } from "./global-insight-segment.js";

test("GlobalInsightSegmentView shows the status in capitals", () => {
  const item = newGlobalInsightSegment("code-84", "label-329");
  const view = toGlobalInsightSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalInsightSegmentViews([item, item]).length, 2, "views");
});
