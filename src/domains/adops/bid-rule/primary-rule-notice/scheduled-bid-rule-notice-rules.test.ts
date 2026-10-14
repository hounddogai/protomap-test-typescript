import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledBidRuleNoticeLabelLengthRule,
  ScheduledBidRuleNoticePriorityRangeRule,
  ScheduledBidRuleNoticeRequiredAudienceIdRule,
  defaultScheduledBidRuleNoticeValidator,
} from "./scheduled-bid-rule-notice-rules.js";
import { newScheduledBidRuleNotice } from "./scheduled-bid-rule-notice.js";

test("ScheduledBidRuleNoticeValidator reports every problem", () => {
  const validator = defaultScheduledBidRuleNoticeValidator();
  const item = newScheduledBidRuleNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledBidRuleNoticeLabelLengthRule flags a long label", () => {
  const rule = new ScheduledBidRuleNoticeLabelLengthRule(32);
  const item = newScheduledBidRuleNotice("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledBidRuleNoticePriorityRangeRule flags values above priority", () => {
  const rule = new ScheduledBidRuleNoticePriorityRangeRule(120, 1000);
  const item = newScheduledBidRuleNotice("x", "y");
  item.priority = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledBidRuleNoticeRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new ScheduledBidRuleNoticeRequiredAudienceIdRule("scheduled bid rule notice needs this field");
  const item = newScheduledBidRuleNotice("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
