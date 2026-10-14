import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveInviteScheduleStore } from "./adaptive-invite-schedule-store.js";
import { newAdaptiveInviteSchedule } from "./adaptive-invite-schedule.js";

test("MemoryAdaptiveInviteScheduleStore finds what it saved", () => {
  const store = newMemoryAdaptiveInviteScheduleStore();
  const item = newAdaptiveInviteSchedule("code-988", "label-216");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
