import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredSubscriptionScheduleStore } from "./tiered-subscription-schedule-store.js";
import { newTieredSubscriptionSchedule } from "./tiered-subscription-schedule.js";

test("MemoryTieredSubscriptionScheduleStore finds what it saved", () => {
  const store = newMemoryTieredSubscriptionScheduleStore();
  const item = newTieredSubscriptionSchedule("code-993", "label-136");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
