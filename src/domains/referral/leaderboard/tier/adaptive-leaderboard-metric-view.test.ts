import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveLeaderboardMetricView,
  toAdaptiveLeaderboardMetricViews,
} from "./adaptive-leaderboard-metric-view.js";
import { newAdaptiveLeaderboardMetric } from "./adaptive-leaderboard-metric.js";

test("AdaptiveLeaderboardMetricView shows the status in capitals", () => {
  const item = newAdaptiveLeaderboardMetric("code-769", "name-413");
  const view = toAdaptiveLeaderboardMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveLeaderboardMetricViews([item, item]).length, 2, "views");
});
