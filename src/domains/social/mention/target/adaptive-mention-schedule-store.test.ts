import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveMentionScheduleStore } from "./adaptive-mention-schedule-store.js";
import { newAdaptiveMentionSchedule } from "./adaptive-mention-schedule.js";

test("MemoryAdaptiveMentionScheduleStore finds what it saved", () => {
  const store = newMemoryAdaptiveMentionScheduleStore();
  const item = newAdaptiveMentionSchedule("code-700", "label-823");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
