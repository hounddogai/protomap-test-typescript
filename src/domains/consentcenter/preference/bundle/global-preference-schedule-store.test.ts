import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalPreferenceScheduleStore } from "./global-preference-schedule-store.js";
import { newGlobalPreferenceSchedule } from "./global-preference-schedule.js";

test("MemoryGlobalPreferenceScheduleStore finds what it saved", () => {
  const store = newMemoryGlobalPreferenceScheduleStore();
  const item = newGlobalPreferenceSchedule("code-843", "title-777");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
