import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalInsightScheduleStore } from "./seasonal-insight-schedule-store.js";
import { newSeasonalInsightSchedule } from "./seasonal-insight-schedule.js";

test("MemorySeasonalInsightScheduleStore finds what it saved", () => {
  const store = newMemorySeasonalInsightScheduleStore();
  const item = newSeasonalInsightSchedule("code-535", "title-585");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
