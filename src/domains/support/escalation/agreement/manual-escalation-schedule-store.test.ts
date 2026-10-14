import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualEscalationScheduleStore } from "./manual-escalation-schedule-store.js";
import { newManualEscalationSchedule } from "./manual-escalation-schedule.js";

test("MemoryManualEscalationScheduleStore finds what it saved", () => {
  const store = newMemoryManualEscalationScheduleStore();
  const item = newManualEscalationSchedule("code-940", "title-481");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
