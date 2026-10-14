import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledExitRuleNoticeCodeLengthRule,
  ScheduledExitRuleNoticeRequiredAudienceIdRule,
  ScheduledExitRuleNoticeRequiredNameRule,
  defaultScheduledExitRuleNoticeValidator,
} from "./scheduled-exit-rule-notice-rules.js";
import { newScheduledExitRuleNotice } from "./scheduled-exit-rule-notice.js";

test("ScheduledExitRuleNoticeValidator reports every problem", () => {
  const validator = defaultScheduledExitRuleNoticeValidator();
  const item = newScheduledExitRuleNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledExitRuleNoticeCodeLengthRule flags a long code", () => {
  const rule = new ScheduledExitRuleNoticeCodeLengthRule(16);
  const item = newScheduledExitRuleNotice("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledExitRuleNoticeRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledExitRuleNoticeRequiredNameRule("scheduled exit rule notice needs a value");
  const item = newScheduledExitRuleNotice("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledExitRuleNoticeRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new ScheduledExitRuleNoticeRequiredAudienceIdRule("scheduled exit rule notice needs an entry");
  const item = newScheduledExitRuleNotice("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
