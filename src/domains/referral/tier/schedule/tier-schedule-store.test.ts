import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierScheduleStore } from "./tier-schedule-store.js";
import { newTierSchedule } from "./tier-schedule.js";

test("MemoryTierScheduleStore finds what it saved", () => {
  const store = newMemoryTierScheduleStore();
  const item = newTierSchedule("code-864", "name-433");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
