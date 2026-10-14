import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInScheduleStore } from "./double-opt-in-schedule-store.js";
import { newDoubleOptInSchedule } from "./double-opt-in-schedule.js";

test("MemoryDoubleOptInScheduleStore finds what it saved", () => {
  const store = newMemoryDoubleOptInScheduleStore();
  const item = newDoubleOptInSchedule("code-53", "label-557");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
