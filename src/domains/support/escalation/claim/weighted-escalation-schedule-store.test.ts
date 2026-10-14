import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedEscalationScheduleStore } from "./weighted-escalation-schedule-store.js";
import { newWeightedEscalationSchedule } from "./weighted-escalation-schedule.js";

test("MemoryWeightedEscalationScheduleStore finds what it saved", () => {
  const store = newMemoryWeightedEscalationScheduleStore();
  const item = newWeightedEscalationSchedule("code-41", "label-633");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
