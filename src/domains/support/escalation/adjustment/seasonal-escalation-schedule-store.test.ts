import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalEscalationScheduleStore } from "./seasonal-escalation-schedule-store.js";
import { newSeasonalEscalationSchedule } from "./seasonal-escalation-schedule.js";

test("MemorySeasonalEscalationScheduleStore finds what it saved", () => {
  const store = newMemorySeasonalEscalationScheduleStore();
  const item = newSeasonalEscalationSchedule("code-815", "name-358");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
