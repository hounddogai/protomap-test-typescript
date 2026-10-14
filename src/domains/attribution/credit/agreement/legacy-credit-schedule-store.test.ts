import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyCreditScheduleStore } from "./legacy-credit-schedule-store.js";
import { newLegacyCreditSchedule } from "./legacy-credit-schedule.js";

test("MemoryLegacyCreditScheduleStore finds what it saved", () => {
  const store = newMemoryLegacyCreditScheduleStore();
  const item = newLegacyCreditSchedule("code-196", "label-388");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
