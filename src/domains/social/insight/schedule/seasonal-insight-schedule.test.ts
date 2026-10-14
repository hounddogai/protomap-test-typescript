import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalInsightSchedule } from "./seasonal-insight-schedule.js";

test("SeasonalInsightSchedule starts in idle", () => {
  const item = newSeasonalInsightSchedule("code-535", "title-585");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalInsightSchedule moves to warming", () => {
  const item = newSeasonalInsightSchedule("code-535", "title-585");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("SeasonalInsightSchedule rejects moves from stopped", () => {
  const item = newSeasonalInsightSchedule("code-535", "title-585");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
