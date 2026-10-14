import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupScheduleStore } from "./warmup-schedule-store.js";
import { newWarmupSchedule } from "./warmup-schedule.js";

test("MemoryWarmupScheduleStore finds what it saved", () => {
  const store = newMemoryWarmupScheduleStore();
  const item = newWarmupSchedule("code-862", "title-542");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
