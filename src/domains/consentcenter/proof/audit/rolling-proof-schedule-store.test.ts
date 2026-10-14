import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingProofScheduleStore } from "./rolling-proof-schedule-store.js";
import { newRollingProofSchedule } from "./rolling-proof-schedule.js";

test("MemoryRollingProofScheduleStore finds what it saved", () => {
  const store = newMemoryRollingProofScheduleStore();
  const item = newRollingProofSchedule("code-457", "name-256");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
