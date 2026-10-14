import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveSuppressionRequestView,
  toAdaptiveSuppressionRequestViews,
} from "./adaptive-suppression-request-view.js";
import { newAdaptiveSuppressionRequest } from "./adaptive-suppression-request.js";

test("AdaptiveSuppressionRequestView shows the status in capitals", () => {
  const item = newAdaptiveSuppressionRequest("code-365", "title-401");
  const view = toAdaptiveSuppressionRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveSuppressionRequestViews([item, item]).length, 2, "views");
});
