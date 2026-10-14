import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewScheduleStore } from "./ticket-view-schedule-store.js";
import { newTicketViewSchedule } from "./ticket-view-schedule.js";

test("MemoryTicketViewScheduleStore finds what it saved", () => {
  const store = newMemoryTicketViewScheduleStore();
  const item = newTicketViewSchedule("code-759", "label-434");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
