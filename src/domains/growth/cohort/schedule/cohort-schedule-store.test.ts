import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortScheduleStore } from "./cohort-schedule-store.js";
import { newCohortSchedule } from "./cohort-schedule.js";

test("MemoryCohortScheduleStore finds what it saved", () => {
  const store = newMemoryCohortScheduleStore();
  const item = newCohortSchedule("code-566", "label-805");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
