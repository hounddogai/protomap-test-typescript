import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalMentionScheduleStore } from "./seasonal-mention-schedule-store.js";
import { newSeasonalMentionSchedule } from "./seasonal-mention-schedule.js";

test("MemorySeasonalMentionScheduleStore finds what it saved", () => {
  const store = newMemorySeasonalMentionScheduleStore();
  const item = newSeasonalMentionSchedule("code-417", "label-756");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
