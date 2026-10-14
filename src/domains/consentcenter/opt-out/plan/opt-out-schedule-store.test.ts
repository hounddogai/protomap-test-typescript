import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutScheduleStore } from "./opt-out-schedule-store.js";
import { newOptOutSchedule } from "./opt-out-schedule.js";

test("MemoryOptOutScheduleStore finds what it saved", () => {
  const store = newMemoryOptOutScheduleStore();
  const item = newOptOutSchedule("code-892", "title-437");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
