import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingActivationScheduleStore } from "./pending-activation-schedule-store.js";
import { newPendingActivationSchedule } from "./pending-activation-schedule.js";

test("MemoryPendingActivationScheduleStore finds what it saved", () => {
  const store = newMemoryPendingActivationScheduleStore();
  const item = newPendingActivationSchedule("code-418", "label-117");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
