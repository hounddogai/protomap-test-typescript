import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toStrictTouchpointBaselineView,
  toStrictTouchpointBaselineViews,
} from "./strict-touchpoint-baseline-view.js";
import { newStrictTouchpointBaseline } from "./strict-touchpoint-baseline.js";

test("StrictTouchpointBaselineView shows the status in capitals", () => {
  const item = newStrictTouchpointBaseline("code-298", "name-99");
  const view = toStrictTouchpointBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictTouchpointBaselineViews([item, item]).length, 2, "views");
});
