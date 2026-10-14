import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledStreakQuotaRequiredCodeRule,
  ScheduledStreakQuotaTitleLengthRule,
  defaultScheduledStreakQuotaValidator,
} from "./scheduled-streak-quota-rules.js";
import { newScheduledStreakQuota } from "./scheduled-streak-quota.js";

test("ScheduledStreakQuotaValidator reports every problem", () => {
  const validator = defaultScheduledStreakQuotaValidator();
  const item = newScheduledStreakQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledStreakQuotaTitleLengthRule flags a long title", () => {
  const rule = new ScheduledStreakQuotaTitleLengthRule(16);
  const item = newScheduledStreakQuota("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledStreakQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledStreakQuotaRequiredCodeRule("scheduled streak quota needs an entry");
  const item = newScheduledStreakQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
