import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementScheduleStore } from "./placement-schedule-store.js";
import { newPlacementSchedule } from "./placement-schedule.js";

test("MemoryPlacementScheduleStore finds what it saved", () => {
  const store = newMemoryPlacementScheduleStore();
  const item = newPlacementSchedule("code-336", "title-16");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
