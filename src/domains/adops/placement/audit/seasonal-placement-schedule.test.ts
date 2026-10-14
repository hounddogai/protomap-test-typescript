import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalPlacementSchedule } from "./seasonal-placement-schedule.js";

test("SeasonalPlacementSchedule starts in planned", () => {
  const item = newSeasonalPlacementSchedule("code-675", "title-283");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalPlacementSchedule moves to in progress", () => {
  const item = newSeasonalPlacementSchedule("code-675", "title-283");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("SeasonalPlacementSchedule rejects moves from cancelled", () => {
  const item = newSeasonalPlacementSchedule("code-675", "title-283");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
