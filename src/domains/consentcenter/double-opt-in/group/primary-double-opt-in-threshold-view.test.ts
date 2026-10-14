import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPrimaryDoubleOptInThresholdView,
  toPrimaryDoubleOptInThresholdViews,
} from "./primary-double-opt-in-threshold-view.js";
import { newPrimaryDoubleOptInThreshold } from "./primary-double-opt-in-threshold.js";

test("PrimaryDoubleOptInThresholdView shows the status in capitals", () => {
  const item = newPrimaryDoubleOptInThreshold("code-245", "title-887");
  const view = toPrimaryDoubleOptInThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryDoubleOptInThresholdViews([item, item]).length, 2, "views");
});
