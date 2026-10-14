import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortSegmentView, toCohortSegmentViews } from "./cohort-segment-view.js";
import { newCohortSegment } from "./cohort-segment.js";

test("CohortSegmentView shows the status in capitals", () => {
  const item = newCohortSegment("code-897", "title-171");
  const view = toCohortSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortSegmentViews([item, item]).length, 2, "views");
});
