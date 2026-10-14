import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleScheduleStore } from "./exit-rule-schedule-store.js";
import { newExitRuleSchedule } from "./exit-rule-schedule.js";

test("MemoryExitRuleScheduleStore finds what it saved", () => {
  const store = newMemoryExitRuleScheduleStore();
  const item = newExitRuleSchedule("code-638", "label-911");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
