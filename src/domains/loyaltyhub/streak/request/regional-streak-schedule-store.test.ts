import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalStreakScheduleStore } from "./regional-streak-schedule-store.js";
import { newRegionalStreakSchedule } from "./regional-streak-schedule.js";

test("MemoryRegionalStreakScheduleStore finds what it saved", () => {
  const store = newMemoryRegionalStreakScheduleStore();
  const item = newRegionalStreakSchedule("code-342", "label-732");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
