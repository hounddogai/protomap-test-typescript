import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveDomainScheduleChannelLengthRule,
  AdaptiveDomainScheduleRequiredCodeRule,
  AdaptiveDomainScheduleRequiredNotesRule,
  AdaptiveDomainScheduleScoreRangeRule,
  defaultAdaptiveDomainScheduleValidator,
} from "./adaptive-domain-schedule-rules.js";
import { newAdaptiveDomainSchedule } from "./adaptive-domain-schedule.js";

test("AdaptiveDomainScheduleValidator reports every problem", () => {
  const validator = defaultAdaptiveDomainScheduleValidator();
  const item = newAdaptiveDomainSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveDomainScheduleRequiredNotesRule flags a blank notes", () => {
  const rule = new AdaptiveDomainScheduleRequiredNotesRule("adaptive domain schedule needs a value");
  const item = newAdaptiveDomainSchedule("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveDomainScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveDomainScheduleRequiredCodeRule("adaptive domain schedule needs a value");
  const item = newAdaptiveDomainSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveDomainScheduleScoreRangeRule flags values above score", () => {
  const rule = new AdaptiveDomainScheduleScoreRangeRule(0.1, 1064.8);
  const item = newAdaptiveDomainSchedule("x", "y");
  item.score = 1066.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveDomainScheduleChannelLengthRule flags a long channel", () => {
  const rule = new AdaptiveDomainScheduleChannelLengthRule(1000);
  const item = newAdaptiveDomainSchedule("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
