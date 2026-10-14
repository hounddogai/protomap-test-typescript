import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyEscalationScheduleStore } from "./legacy-escalation-schedule-store.js";
import { newLegacyEscalationSchedule } from "./legacy-escalation-schedule.js";

test("MemoryLegacyEscalationScheduleStore finds what it saved", () => {
  const store = newMemoryLegacyEscalationScheduleStore();
  const item = newLegacyEscalationSchedule("code-223", "name-425");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
