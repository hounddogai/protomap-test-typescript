import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualTicketViewScheduleStore } from "./manual-ticket-view-schedule-store.js";
import { newManualTicketViewSchedule } from "./manual-ticket-view-schedule.js";

test("MemoryManualTicketViewScheduleStore finds what it saved", () => {
  const store = newMemoryManualTicketViewScheduleStore();
  const item = newManualTicketViewSchedule("code-774", "title-319");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
