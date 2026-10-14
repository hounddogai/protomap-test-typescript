import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeScheduleStore } from "./creative-schedule-store.js";
import { newCreativeSchedule } from "./creative-schedule.js";

test("MemoryCreativeScheduleStore finds what it saved", () => {
  const store = newMemoryCreativeScheduleStore();
  const item = newCreativeSchedule("code-908", "title-88");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
