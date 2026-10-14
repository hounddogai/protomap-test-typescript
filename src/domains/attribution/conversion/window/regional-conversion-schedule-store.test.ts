import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalConversionScheduleStore } from "./regional-conversion-schedule-store.js";
import { newRegionalConversionSchedule } from "./regional-conversion-schedule.js";

test("MemoryRegionalConversionScheduleStore finds what it saved", () => {
  const store = newMemoryRegionalConversionScheduleStore();
  const item = newRegionalConversionSchedule("code-412", "name-959");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
