import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalPaywallScheduleStore } from "./seasonal-paywall-schedule-store.js";
import { newSeasonalPaywallSchedule } from "./seasonal-paywall-schedule.js";

test("MemorySeasonalPaywallScheduleStore finds what it saved", () => {
  const store = newMemorySeasonalPaywallScheduleStore();
  const item = newSeasonalPaywallSchedule("code-700", "label-497");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
