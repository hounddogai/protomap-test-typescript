import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteScheduleStore } from "./invite-schedule-store.js";
import { newInviteSchedule } from "./invite-schedule.js";

test("MemoryInviteScheduleStore finds what it saved", () => {
  const store = newMemoryInviteScheduleStore();
  const item = newInviteSchedule("code-176", "title-428");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
