import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointScheduleStore } from "./touchpoint-schedule-store.js";
import { newTouchpointSchedule } from "./touchpoint-schedule.js";

test("MemoryTouchpointScheduleStore finds what it saved", () => {
  const store = newMemoryTouchpointScheduleStore();
  const item = newTouchpointSchedule("code-678", "name-452");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
