import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingEscalationScheduleStore } from "./rolling-escalation-schedule-store.js";
import { newRollingEscalationSchedule } from "./rolling-escalation-schedule.js";

test("MemoryRollingEscalationScheduleStore finds what it saved", () => {
  const store = newMemoryRollingEscalationScheduleStore();
  const item = newRollingEscalationSchedule("code-837", "label-657");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
