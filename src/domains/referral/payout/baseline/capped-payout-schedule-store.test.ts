import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedPayoutScheduleStore } from "./capped-payout-schedule-store.js";
import { newCappedPayoutSchedule } from "./capped-payout-schedule.js";

test("MemoryCappedPayoutScheduleStore finds what it saved", () => {
  const store = newMemoryCappedPayoutScheduleStore();
  const item = newCappedPayoutSchedule("code-871", "name-311");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
