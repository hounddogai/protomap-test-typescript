import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueueScheduleStore } from "./queue-schedule-store.js";
import { newQueueSchedule } from "./queue-schedule.js";

test("MemoryQueueScheduleStore finds what it saved", () => {
  const store = newMemoryQueueScheduleStore();
  const item = newQueueSchedule("code-440", "title-414");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
