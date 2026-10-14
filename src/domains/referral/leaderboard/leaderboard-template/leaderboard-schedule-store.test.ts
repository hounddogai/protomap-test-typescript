import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardScheduleStore } from "./leaderboard-schedule-store.js";
import { newLeaderboardSchedule } from "./leaderboard-schedule.js";

test("MemoryLeaderboardScheduleStore finds what it saved", () => {
  const store = newMemoryLeaderboardScheduleStore();
  const item = newLeaderboardSchedule("code-159", "label-457");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
