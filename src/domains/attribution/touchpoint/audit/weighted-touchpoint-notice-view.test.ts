import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedTouchpointNoticeView,
  toWeightedTouchpointNoticeViews,
} from "./weighted-touchpoint-notice-view.js";
import { newWeightedTouchpointNotice } from "./weighted-touchpoint-notice.js";

test("WeightedTouchpointNoticeView shows the status in capitals", () => {
  const item = newWeightedTouchpointNotice("code-714", "name-765");
  const view = toWeightedTouchpointNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedTouchpointNoticeViews([item, item]).length, 2, "views");
});
