import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredEnrollmentScheduleStore } from "./tiered-enrollment-schedule-store.js";
import { newTieredEnrollmentSchedule } from "./tiered-enrollment-schedule.js";

test("MemoryTieredEnrollmentScheduleStore finds what it saved", () => {
  const store = newMemoryTieredEnrollmentScheduleStore();
  const item = newTieredEnrollmentSchedule("code-451", "title-26");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
