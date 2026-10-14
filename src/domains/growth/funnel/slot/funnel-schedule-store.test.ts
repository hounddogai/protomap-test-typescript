import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelScheduleStore } from "./funnel-schedule-store.js";
import { newFunnelSchedule } from "./funnel-schedule.js";

test("MemoryFunnelScheduleStore finds what it saved", () => {
  const store = newMemoryFunnelScheduleStore();
  const item = newFunnelSchedule("code-519", "title-846");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
