import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientOptOutScheduleStore } from "./lenient-opt-out-schedule-store.js";
import { newLenientOptOutSchedule } from "./lenient-opt-out-schedule.js";

test("MemoryLenientOptOutScheduleStore finds what it saved", () => {
  const store = newMemoryLenientOptOutScheduleStore();
  const item = newLenientOptOutSchedule("code-803", "name-539");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
