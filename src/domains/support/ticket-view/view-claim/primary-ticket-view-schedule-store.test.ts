import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryTicketViewScheduleStore } from "./primary-ticket-view-schedule-store.js";
import { newPrimaryTicketViewSchedule } from "./primary-ticket-view-schedule.js";

test("MemoryPrimaryTicketViewScheduleStore finds what it saved", () => {
  const store = newMemoryPrimaryTicketViewScheduleStore();
  const item = newPrimaryTicketViewSchedule("code-730", "label-769");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
