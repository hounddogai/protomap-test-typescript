import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyScheduleStore } from "./journey-schedule-store.js";
import { newJourneySchedule } from "./journey-schedule.js";

test("MemoryJourneyScheduleStore finds what it saved", () => {
  const store = newMemoryJourneyScheduleStore();
  const item = newJourneySchedule("code-972", "label-542");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
