import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictProofScheduleStore } from "./strict-proof-schedule-store.js";
import { newStrictProofSchedule } from "./strict-proof-schedule.js";

test("MemoryStrictProofScheduleStore finds what it saved", () => {
  const store = newMemoryStrictProofScheduleStore();
  const item = newStrictProofSchedule("code-404", "label-459");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
