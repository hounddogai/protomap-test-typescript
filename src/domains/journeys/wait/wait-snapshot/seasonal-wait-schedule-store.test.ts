import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalWaitScheduleStore } from "./seasonal-wait-schedule-store.js";
import { newSeasonalWaitSchedule } from "./seasonal-wait-schedule.js";

test("MemorySeasonalWaitScheduleStore finds what it saved", () => {
  const store = newMemorySeasonalWaitScheduleStore();
  const item = newSeasonalWaitSchedule("code-351", "title-579");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
