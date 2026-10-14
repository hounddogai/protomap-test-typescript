import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingScheduleStore } from "./pacing-schedule-store.js";
import { newPacingSchedule } from "./pacing-schedule.js";

test("MemoryPacingScheduleStore finds what it saved", () => {
  const store = newMemoryPacingScheduleStore();
  const item = newPacingSchedule("code-988", "label-350");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
