import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathSegmentView, toPathSegmentViews } from "./path-segment-view.js";
import { newPathSegment } from "./path-segment.js";

test("PathSegmentView shows the status in capitals", () => {
  const item = newPathSegment("code-602", "title-960");
  const view = toPathSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathSegmentViews([item, item]).length, 2, "views");
});
