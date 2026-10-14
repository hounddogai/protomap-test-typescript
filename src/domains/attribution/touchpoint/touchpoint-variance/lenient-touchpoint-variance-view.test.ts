import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLenientTouchpointVarianceView,
  toLenientTouchpointVarianceViews,
} from "./lenient-touchpoint-variance-view.js";
import { newLenientTouchpointVariance } from "./lenient-touchpoint-variance.js";

test("LenientTouchpointVarianceView shows the status in capitals", () => {
  const item = newLenientTouchpointVariance("code-797", "name-264");
  const view = toLenientTouchpointVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientTouchpointVarianceViews([item, item]).length, 2, "views");
});
