import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedSlaScheduleStore } from "./capped-sla-schedule-store.js";
import { newCappedSlaSchedule } from "./capped-sla-schedule.js";

test("MemoryCappedSlaScheduleStore finds what it saved", () => {
  const store = newMemoryCappedSlaScheduleStore();
  const item = newCappedSlaSchedule("code-519", "name-600");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
