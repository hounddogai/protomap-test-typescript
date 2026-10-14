import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationScheduleStore } from "./escalation-schedule-store.js";
import { newEscalationSchedule } from "./escalation-schedule.js";

test("MemoryEscalationScheduleStore finds what it saved", () => {
  const store = newMemoryEscalationScheduleStore();
  const item = newEscalationSchedule("code-441", "label-105");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
