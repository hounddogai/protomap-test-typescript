import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointVarianceView, toTouchpointVarianceViews } from "./touchpoint-variance-view.js";
import { newTouchpointVariance } from "./touchpoint-variance.js";

test("TouchpointVarianceView shows the status in capitals", () => {
  const item = newTouchpointVariance("code-635", "label-630");
  const view = toTouchpointVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointVarianceViews([item, item]).length, 2, "views");
});
