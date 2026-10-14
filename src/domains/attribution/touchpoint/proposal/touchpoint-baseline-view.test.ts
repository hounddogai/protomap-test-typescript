import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointBaselineView, toTouchpointBaselineViews } from "./touchpoint-baseline-view.js";
import { newTouchpointBaseline } from "./touchpoint-baseline.js";

test("TouchpointBaselineView shows the status in capitals", () => {
  const item = newTouchpointBaseline("code-115", "name-244");
  const view = toTouchpointBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointBaselineViews([item, item]).length, 2, "views");
});
