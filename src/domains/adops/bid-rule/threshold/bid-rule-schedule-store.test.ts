import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleScheduleStore } from "./bid-rule-schedule-store.js";
import { newBidRuleSchedule } from "./bid-rule-schedule.js";

test("MemoryBidRuleScheduleStore finds what it saved", () => {
  const store = newMemoryBidRuleScheduleStore();
  const item = newBidRuleSchedule("code-881", "title-59");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
