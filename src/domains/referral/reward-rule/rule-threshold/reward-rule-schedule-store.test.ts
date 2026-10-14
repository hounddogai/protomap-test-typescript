import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleScheduleStore } from "./reward-rule-schedule-store.js";
import { newRewardRuleSchedule } from "./reward-rule-schedule.js";

test("MemoryRewardRuleScheduleStore finds what it saved", () => {
  const store = newMemoryRewardRuleScheduleStore();
  const item = newRewardRuleSchedule("code-602", "name-349");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
