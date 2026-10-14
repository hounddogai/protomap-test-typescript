import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingFlightScoreView, toRollingFlightScoreViews } from "./rolling-flight-score-view.js";
import { newRollingFlightScore } from "./rolling-flight-score.js";

test("RollingFlightScoreView shows the status in capitals", () => {
  const item = newRollingFlightScore("code-326", "label-42");
  const view = toRollingFlightScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingFlightScoreViews([item, item]).length, 2, "views");
});
