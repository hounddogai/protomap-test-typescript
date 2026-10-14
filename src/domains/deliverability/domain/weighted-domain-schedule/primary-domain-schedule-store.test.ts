import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryDomainScheduleStore } from "./primary-domain-schedule-store.js";
import { newPrimaryDomainSchedule } from "./primary-domain-schedule.js";

test("MemoryPrimaryDomainScheduleStore finds what it saved", () => {
  const store = newMemoryPrimaryDomainScheduleStore();
  const item = newPrimaryDomainSchedule("code-831", "title-374");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
