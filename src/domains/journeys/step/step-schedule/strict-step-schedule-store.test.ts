import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictStepScheduleStore } from "./strict-step-schedule-store.js";
import { newStrictStepSchedule } from "./strict-step-schedule.js";

test("MemoryStrictStepScheduleStore finds what it saved", () => {
  const store = newMemoryStrictStepScheduleStore();
  const item = newStrictStepSchedule("code-41", "label-194");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
