import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingJourneyTargetView, toRollingJourneyTargetViews } from "./rolling-journey-target-view.js";
import { newRollingJourneyTarget } from "./rolling-journey-target.js";

test("RollingJourneyTargetView shows the status in capitals", () => {
  const item = newRollingJourneyTarget("code-965", "title-125");
  const view = toRollingJourneyTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingJourneyTargetViews([item, item]).length, 2, "views");
});
