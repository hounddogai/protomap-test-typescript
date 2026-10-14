import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryCsatScheduleStore } from "./primary-csat-schedule-store.js";
import { newPrimaryCsatSchedule } from "./primary-csat-schedule.js";

test("MemoryPrimaryCsatScheduleStore finds what it saved", () => {
  const store = newMemoryPrimaryCsatScheduleStore();
  const item = newPrimaryCsatSchedule("code-200", "name-262");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
