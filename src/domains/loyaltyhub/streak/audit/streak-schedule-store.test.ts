import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStreakScheduleStore } from "./streak-schedule-store.js";
import { newStreakSchedule } from "./streak-schedule.js";

test("MemoryStreakScheduleStore finds what it saved", () => {
  const store = newMemoryStreakScheduleStore();
  const item = newStreakSchedule("code-696", "label-292");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
