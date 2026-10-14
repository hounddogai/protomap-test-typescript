import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroScheduleStore } from "./macro-schedule-store.js";
import { newMacroSchedule } from "./macro-schedule.js";

test("MemoryMacroScheduleStore finds what it saved", () => {
  const store = newMemoryMacroScheduleStore();
  const item = newMacroSchedule("code-163", "title-774");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
