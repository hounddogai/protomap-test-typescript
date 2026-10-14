import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalWaitSchedule } from "./seasonal-wait-schedule.js";

test("SeasonalWaitSchedule starts in requested", () => {
  const item = newSeasonalWaitSchedule("code-351", "title-579");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalWaitSchedule moves to expired", () => {
  const item = newSeasonalWaitSchedule("code-351", "title-579");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("SeasonalWaitSchedule rejects moves from expired", () => {
  const item = newSeasonalWaitSchedule("code-351", "title-579");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
