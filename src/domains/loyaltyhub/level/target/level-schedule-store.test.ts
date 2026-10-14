import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLevelScheduleStore } from "./level-schedule-store.js";
import { newLevelSchedule } from "./level-schedule.js";

test("MemoryLevelScheduleStore finds what it saved", () => {
  const store = newMemoryLevelScheduleStore();
  const item = newLevelSchedule("code-957", "name-630");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
