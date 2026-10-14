import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalTouchpointCheckpointView,
  toSeasonalTouchpointCheckpointViews,
} from "./seasonal-touchpoint-checkpoint-view.js";
import { newSeasonalTouchpointCheckpoint } from "./seasonal-touchpoint-checkpoint.js";

test("SeasonalTouchpointCheckpointView shows the status in capitals", () => {
  const item = newSeasonalTouchpointCheckpoint("code-680", "label-720");
  const view = toSeasonalTouchpointCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalTouchpointCheckpointViews([item, item]).length, 2, "views");
});
