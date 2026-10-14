import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedInviteScheduleStore } from "./batched-invite-schedule-store.js";
import { newBatchedInviteSchedule } from "./batched-invite-schedule.js";

test("MemoryBatchedInviteScheduleStore finds what it saved", () => {
  const store = newMemoryBatchedInviteScheduleStore();
  const item = newBatchedInviteSchedule("code-922", "title-407");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
