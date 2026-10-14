import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatScheduleStore } from "./csat-schedule-store.js";
import { newCsatSchedule } from "./csat-schedule.js";

test("MemoryCsatScheduleStore finds what it saved", () => {
  const store = newMemoryCsatScheduleStore();
  const item = newCsatSchedule("code-563", "label-942");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
