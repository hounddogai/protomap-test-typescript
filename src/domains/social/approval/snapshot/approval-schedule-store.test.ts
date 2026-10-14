import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalScheduleStore } from "./approval-schedule-store.js";
import { newApprovalSchedule } from "./approval-schedule.js";

test("MemoryApprovalScheduleStore finds what it saved", () => {
  const store = newMemoryApprovalScheduleStore();
  const item = newApprovalSchedule("code-761", "name-459");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
