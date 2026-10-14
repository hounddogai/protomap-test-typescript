import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryBidRuleScheduleStore } from "./primary-bid-rule-schedule-store.js";
import { newPrimaryBidRuleSchedule } from "./primary-bid-rule-schedule.js";

test("MemoryPrimaryBidRuleScheduleStore finds what it saved", () => {
  const store = newMemoryPrimaryBidRuleScheduleStore();
  const item = newPrimaryBidRuleSchedule("code-365", "name-45");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
