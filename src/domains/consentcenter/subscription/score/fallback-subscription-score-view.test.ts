import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackSubscriptionScoreView,
  toFallbackSubscriptionScoreViews,
} from "./fallback-subscription-score-view.js";
import { newFallbackSubscriptionScore } from "./fallback-subscription-score.js";

test("FallbackSubscriptionScoreView shows the status in capitals", () => {
  const item = newFallbackSubscriptionScore("code-301", "label-21");
  const view = toFallbackSubscriptionScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackSubscriptionScoreViews([item, item]).length, 2, "views");
});
