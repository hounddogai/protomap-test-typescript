import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledFlightScoreView, toScheduledFlightScoreViews } from "./scheduled-flight-score-view.js";
import { newScheduledFlightScore } from "./scheduled-flight-score.js";

test("ScheduledFlightScoreView shows the status in capitals", () => {
  const item = newScheduledFlightScore("code-543", "title-373");
  const view = toScheduledFlightScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledFlightScoreViews([item, item]).length, 2, "views");
});
