import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedApprovalScheduleStore } from "./weighted-approval-schedule-store.js";
import { newWeightedApprovalSchedule } from "./weighted-approval-schedule.js";

test("MemoryWeightedApprovalScheduleStore finds what it saved", () => {
  const store = newMemoryWeightedApprovalScheduleStore();
  const item = newWeightedApprovalSchedule("code-714", "name-792");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
