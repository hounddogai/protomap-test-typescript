import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallScheduleStore } from "./paywall-schedule-store.js";
import { newPaywallSchedule } from "./paywall-schedule.js";

test("MemoryPaywallScheduleStore finds what it saved", () => {
  const store = newMemoryPaywallScheduleStore();
  const item = newPaywallSchedule("code-3", "label-169");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
