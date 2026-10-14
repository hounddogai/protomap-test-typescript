import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeScheduleStore } from "./challenge-schedule-store.js";
import { newChallengeSchedule } from "./challenge-schedule.js";

test("MemoryChallengeScheduleStore finds what it saved", () => {
  const store = newMemoryChallengeScheduleStore();
  const item = newChallengeSchedule("code-435", "label-632");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
