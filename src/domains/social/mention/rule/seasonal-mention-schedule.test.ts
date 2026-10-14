import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalMentionSchedule } from "./seasonal-mention-schedule.js";

test("SeasonalMentionSchedule starts in idle", () => {
  const item = newSeasonalMentionSchedule("code-417", "label-756");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalMentionSchedule moves to ready", () => {
  const item = newSeasonalMentionSchedule("code-417", "label-756");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("SeasonalMentionSchedule rejects moves from stopped", () => {
  const item = newSeasonalMentionSchedule("code-417", "label-756");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
