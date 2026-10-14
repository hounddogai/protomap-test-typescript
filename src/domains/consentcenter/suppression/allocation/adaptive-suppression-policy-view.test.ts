import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveSuppressionPolicyView,
  toAdaptiveSuppressionPolicyViews,
} from "./adaptive-suppression-policy-view.js";
import { newAdaptiveSuppressionPolicy } from "./adaptive-suppression-policy.js";

test("AdaptiveSuppressionPolicyView shows the status in capitals", () => {
  const item = newAdaptiveSuppressionPolicy("code-243", "label-326");
  const view = toAdaptiveSuppressionPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveSuppressionPolicyViews([item, item]).length, 2, "views");
});
