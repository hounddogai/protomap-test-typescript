import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderScheduleStore } from "./sender-schedule-store.js";
import { newSenderSchedule } from "./sender-schedule.js";

test("MemorySenderScheduleStore finds what it saved", () => {
  const store = newMemorySenderScheduleStore();
  const item = newSenderSchedule("code-791", "name-421");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
