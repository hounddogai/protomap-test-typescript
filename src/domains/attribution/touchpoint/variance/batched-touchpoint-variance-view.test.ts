import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toBatchedTouchpointVarianceView,
  toBatchedTouchpointVarianceViews,
} from "./batched-touchpoint-variance-view.js";
import { newBatchedTouchpointVariance } from "./batched-touchpoint-variance.js";

test("BatchedTouchpointVarianceView shows the status in capitals", () => {
  const item = newBatchedTouchpointVariance("code-135", "title-589");
  const view = toBatchedTouchpointVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedTouchpointVarianceViews([item, item]).length, 2, "views");
});
