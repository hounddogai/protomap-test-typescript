import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientInsightScheduleStore } from "./lenient-insight-schedule-store.js";
import { newLenientInsightSchedule } from "./lenient-insight-schedule.js";

test("MemoryLenientInsightScheduleStore finds what it saved", () => {
  const store = newMemoryLenientInsightScheduleStore();
  const item = newLenientInsightSchedule("code-6", "label-822");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
