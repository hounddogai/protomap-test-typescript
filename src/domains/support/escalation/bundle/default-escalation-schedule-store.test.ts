import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultEscalationScheduleStore } from "./default-escalation-schedule-store.js";
import { newDefaultEscalationSchedule } from "./default-escalation-schedule.js";

test("MemoryDefaultEscalationScheduleStore finds what it saved", () => {
  const store = newMemoryDefaultEscalationScheduleStore();
  const item = newDefaultEscalationSchedule("code-542", "title-629");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
