import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackDomainScheduleStore } from "./fallback-domain-schedule-store.js";
import { newFallbackDomainSchedule } from "./fallback-domain-schedule.js";

test("MemoryFallbackDomainScheduleStore finds what it saved", () => {
  const store = newMemoryFallbackDomainScheduleStore();
  const item = newFallbackDomainSchedule("code-922", "label-959");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
