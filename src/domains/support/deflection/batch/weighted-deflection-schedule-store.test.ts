import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedDeflectionScheduleStore } from "./weighted-deflection-schedule-store.js";
import { newWeightedDeflectionSchedule } from "./weighted-deflection-schedule.js";

test("MemoryWeightedDeflectionScheduleStore finds what it saved", () => {
  const store = newMemoryWeightedDeflectionScheduleStore();
  const item = newWeightedDeflectionSchedule("code-476", "title-952");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
