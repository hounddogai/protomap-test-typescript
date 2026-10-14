import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingEscalationScheduleStore } from "./pending-escalation-schedule-store.js";
import { newPendingEscalationSchedule } from "./pending-escalation-schedule.js";

test("MemoryPendingEscalationScheduleStore finds what it saved", () => {
  const store = newMemoryPendingEscalationScheduleStore();
  const item = newPendingEscalationSchedule("code-978", "name-908");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
