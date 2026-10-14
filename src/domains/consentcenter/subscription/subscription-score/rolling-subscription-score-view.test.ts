import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRollingSubscriptionScoreView,
  toRollingSubscriptionScoreViews,
} from "./rolling-subscription-score-view.js";
import { newRollingSubscriptionScore } from "./rolling-subscription-score.js";

test("RollingSubscriptionScoreView shows the status in capitals", () => {
  const item = newRollingSubscriptionScore("code-941", "title-330");
  const view = toRollingSubscriptionScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingSubscriptionScoreViews([item, item]).length, 2, "views");
});
