import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionScheduleStore } from "./deflection-schedule-store.js";
import { newDeflectionSchedule } from "./deflection-schedule.js";

test("MemoryDeflectionScheduleStore finds what it saved", () => {
  const store = newMemoryDeflectionScheduleStore();
  const item = newDeflectionSchedule("code-376", "title-903");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
