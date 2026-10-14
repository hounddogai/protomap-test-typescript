import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientSlaScheduleStore } from "./lenient-sla-schedule-store.js";
import { newLenientSlaSchedule } from "./lenient-sla-schedule.js";

test("MemoryLenientSlaScheduleStore finds what it saved", () => {
  const store = newMemoryLenientSlaScheduleStore();
  const item = newLenientSlaSchedule("code-550", "title-932");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
