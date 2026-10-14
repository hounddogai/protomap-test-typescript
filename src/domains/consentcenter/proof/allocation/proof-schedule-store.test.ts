import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofScheduleStore } from "./proof-schedule-store.js";
import { newProofSchedule } from "./proof-schedule.js";

test("MemoryProofScheduleStore finds what it saved", () => {
  const store = newMemoryProofScheduleStore();
  const item = newProofSchedule("code-401", "title-381");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
