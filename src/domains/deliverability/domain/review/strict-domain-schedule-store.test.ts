import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictDomainScheduleStore } from "./strict-domain-schedule-store.js";
import { newStrictDomainSchedule } from "./strict-domain-schedule.js";

test("MemoryStrictDomainScheduleStore finds what it saved", () => {
  const store = newMemoryStrictDomainScheduleStore();
  const item = newStrictDomainSchedule("code-342", "title-176");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
