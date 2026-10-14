import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionScheduleStore } from "./conversion-schedule-store.js";
import { newConversionSchedule } from "./conversion-schedule.js";

test("MemoryConversionScheduleStore finds what it saved", () => {
  const store = newMemoryConversionScheduleStore();
  const item = newConversionSchedule("code-378", "label-562");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
