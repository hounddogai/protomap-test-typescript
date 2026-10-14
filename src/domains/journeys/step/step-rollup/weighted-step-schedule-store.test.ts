import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedStepScheduleStore } from "./weighted-step-schedule-store.js";
import { newWeightedStepSchedule } from "./weighted-step-schedule.js";

test("MemoryWeightedStepScheduleStore finds what it saved", () => {
  const store = newMemoryWeightedStepScheduleStore();
  const item = newWeightedStepSchedule("code-710", "title-407");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
