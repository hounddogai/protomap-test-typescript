import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedPacingScheduleStore } from "./weighted-pacing-schedule-store.js";
import { newWeightedPacingSchedule } from "./weighted-pacing-schedule.js";

test("MemoryWeightedPacingScheduleStore finds what it saved", () => {
  const store = newMemoryWeightedPacingScheduleStore();
  const item = newWeightedPacingSchedule("code-708", "name-270");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
