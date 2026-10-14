import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toBatchedTouchpointPreferenceView,
  toBatchedTouchpointPreferenceViews,
} from "./batched-touchpoint-preference-view.js";
import { newBatchedTouchpointPreference } from "./batched-touchpoint-preference.js";

test("BatchedTouchpointPreferenceView shows the status in capitals", () => {
  const item = newBatchedTouchpointPreference("code-578", "label-452");
  const view = toBatchedTouchpointPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedTouchpointPreferenceViews([item, item]).length, 2, "views");
});
