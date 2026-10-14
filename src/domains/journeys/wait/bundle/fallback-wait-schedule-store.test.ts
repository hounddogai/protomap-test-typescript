import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackWaitScheduleStore } from "./fallback-wait-schedule-store.js";
import { newFallbackWaitSchedule } from "./fallback-wait-schedule.js";

test("MemoryFallbackWaitScheduleStore finds what it saved", () => {
  const store = newMemoryFallbackWaitScheduleStore();
  const item = newFallbackWaitSchedule("code-371", "name-153");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
