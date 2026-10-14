import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalBidRuleScheduleStore } from "./seasonal-bid-rule-schedule-store.js";
import { newSeasonalBidRuleSchedule } from "./seasonal-bid-rule-schedule.js";

test("MemorySeasonalBidRuleScheduleStore finds what it saved", () => {
  const store = newMemorySeasonalBidRuleScheduleStore();
  const item = newSeasonalBidRuleSchedule("code-682", "name-66");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
